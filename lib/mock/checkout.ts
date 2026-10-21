// Alıcı sipariş akışının mock backend'i. Kurallar docs/mvp.md "Edge case'ler"den:
// sunucuda yeniden doğrulama, 10 dakikalık aralık rezervasyonu, fiyatın siparişe
// kopyalanması, idempotency anahtarı, aynı gün son saati, isimsiz gönderim.
import type { TomurcukApi } from "@/lib/api/contract";
import {
  CheckoutError,
  OptionKind,
  OrderSource,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  type DeliveryDay,
  type DraftItem,
  type FieldErrors,
  type Order,
  type OrderDraft,
  type Product,
  type Shop,
} from "@/lib/api/types";
import { addDays, daysBetween } from "@/lib/dates";
import { formatTimeRange, zonedNow } from "@/lib/format";
import { BOOKING_WINDOW_DAYS } from "@/lib/checkout/limits";
import { formatPhone, normalizePhone } from "@/lib/phone";
import { deliveryZones, products, remainingBySlot, shops, timeSlots } from "./data";
import { upsertCustomer } from "./panel";
import { appendNotification, getStore, randomToken, type StoredDraft } from "./store";

const DRAFT_TTL_MS = 2 * 60 * 60 * 1000;
const RESERVATION_MS = 10 * 60 * 1000;
const LIMITS = { name: 80, address: 300, courierNote: 200, cardNote: 250, signature: 60 };

const copy = <T>(value: T): T => structuredClone(value);
const shopById = (id: string): Shop | undefined => shops.find((s) => s.id === id);
const nowIn = (shop: Shop) => zonedNow(new Date(), shop.timeZone);

function liveDraft(shopId: string, draftId: string): StoredDraft | null {
  const draft = getStore().drafts.get(draftId);
  if (!draft || draft.shopId !== shopId) return null;
  if (draft.expiresAt < Date.now()) {
    getStore().drafts.delete(draftId);
    return null;
  }
  return draft;
}

function totals(draft: Pick<OrderDraft, "item" | "delivery">) {
  const subtotal = draft.item.lineTotal;
  const deliveryFee = draft.delivery?.fee ?? 0;
  return { subtotal, deliveryFee, total: subtotal + deliveryFee };
}

/** Ürünün bugünkü fiyatıyla taslak satırı; seçenekler doğrulanır. */
function buildItem(product: Product, optionIds: string[]): { item?: DraftItem; errors: FieldErrors<"size" | "options"> } {
  const chosen = product.options.filter((o) => optionIds.includes(o.id));
  if (chosen.length !== new Set(optionIds).size) return { errors: { options: { code: CheckoutError.OptionInvalid } } };
  const sizes = product.options.filter((o) => o.kind === OptionKind.Size);
  const chosenSizes = chosen.filter((o) => o.kind === OptionKind.Size);
  if (sizes.length > 0 && chosenSizes.length !== 1) return { errors: { size: { code: CheckoutError.SizeRequired } } };
  const options = chosen.map(({ id, name, detail, kind, extraPrice }) => ({ id, name, detail, kind, extraPrice }));
  return {
    errors: {},
    item: {
      productId: product.id,
      productName: product.name,
      unitPrice: product.price,
      options,
      lineTotal: product.price + options.reduce((sum, o) => sum + o.extraPrice, 0),
    },
  };
}

const slotKey = (date: string, slotId: string) => `${date}|${slotId}`;

/** Kalan yer: örnek kapasite − verilen siparişler − başka taslakların geçerli rezervasyonları. */
function remaining(date: string, slotId: string, exceptDraftId?: string): number {
  const slot = timeSlots.find((s) => s.id === slotId);
  if (!slot) return 0;
  const base = remainingBySlot[slotId] ?? slot.capacity;
  const used = getStore().slotUsage.get(slotKey(date, slotId)) ?? 0;
  const now = Date.now();
  const reserved = [...getStore().drafts.values()].filter(
    (d) =>
      d.id !== exceptDraftId &&
      d.delivery?.date === date &&
      d.delivery.slotId === slotId &&
      Date.parse(d.delivery.reservedUntil) > now,
  ).length;
  return Math.max(0, base - used - reserved);
}

function deliveryDays(shop: Shop, days: number, exceptDraftId?: string): DeliveryDay[] {
  const now = nowIn(shop);
  return Array.from({ length: days }, (_, offset) => {
    const date = addDays(now.date, offset);
    const isToday = offset === 0;
    return {
      date,
      closed: false,
      sameDayClosed: isToday && now.time >= shop.sameDayCutoff,
      slots: timeSlots
        .filter((s) => s.shopId === shop.id && (!isToday || s.start > now.time))
        .map((s) => ({ slotId: s.id, remaining: remaining(date, s.id, exceptDraftId) })),
    };
  });
}

/** Seçilen gün ve aralık hâlâ verilebilir mi; değilse hata kodu. */
function checkSlot(shop: Shop, date: string, slotId: string, draftId: string): FieldErrors<"date" | "slotId"> {
  const today = nowIn(shop).date;
  const offset = daysBetween(today, date);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || offset < 0 || offset >= BOOKING_WINDOW_DAYS) {
    return { date: { code: CheckoutError.DateOutOfRange } };
  }
  const day = deliveryDays(shop, offset + 1, draftId)[offset];
  if (day.closed) return { date: { code: CheckoutError.DayClosed } };
  if (day.sameDayClosed) return { date: { code: CheckoutError.SameDayClosed, meta: { cutoff: shop.sameDayCutoff } } };
  const slot = day.slots.find((s) => s.slotId === slotId);
  if (!slotId || !slot) return { slotId: { code: CheckoutError.Required } };
  if (slot.remaining <= 0) {
    const alternative = day.slots.find((s) => s.remaining > 0);
    const alt = alternative && timeSlots.find((s) => s.id === alternative.slotId);
    return { slotId: { code: CheckoutError.SlotFull, meta: alt ? { alternative: formatTimeRange(alt.start, alt.end) } : {} } };
  }
  return {};
}

const hasErrors = (errors: object) => Object.keys(errors).length > 0;

function text(value: string, max: number, required: boolean) {
  const trimmed = value.trim();
  if (required && !trimmed) return { value: trimmed, error: { code: CheckoutError.Required } };
  if (trimmed.length > max) return { value: trimmed, error: { code: CheckoutError.TooLong, meta: { max } } };
  return { value: trimmed };
}

function phone(value: string) {
  if (!value.trim()) return { error: { code: CheckoutError.Required } };
  const normalized = normalizePhone(value);
  return normalized ? { value: formatPhone(normalized) } : { error: { code: CheckoutError.PhoneInvalid } };
}

type CheckoutApi = Pick<
  TomurcukApi,
  | "getDeliveryDays"
  | "createDraft"
  | "getDraft"
  | "saveDelivery"
  | "saveCard"
  | "placeOrder"
  | "getOrderTracking"
  | "findTrackingToken"
>;

export const mockCheckoutApi: CheckoutApi = {
  async getDeliveryDays(shopId, days) {
    const shop = shopById(shopId);
    return shop ? deliveryDays(shop, Math.min(days, BOOKING_WINDOW_DAYS)) : [];
  },

  async createDraft(shopId, { productId, optionIds }) {
    const product = products.find((p) => p.shopId === shopId && p.id === productId && p.active);
    if (!product) return { ok: false, errors: { product: { code: CheckoutError.ProductUnavailable } } };
    const { item, errors } = buildItem(product, optionIds);
    if (!item) return { ok: false, errors };
    const draft: StoredDraft = {
      id: randomToken(20),
      shopId,
      item,
      delivery: null,
      card: null,
      ...totals({ item, delivery: null }),
      expiresAt: Date.now() + DRAFT_TTL_MS,
    };
    getStore().drafts.set(draft.id, draft);
    return { ok: true, value: copy(draft) };
  },

  async getDraft(shopId, draftId) {
    const draft = liveDraft(shopId, draftId);
    return draft ? copy(draft) : null;
  },

  async saveDelivery(shopId, draftId, input) {
    const shop = shopById(shopId);
    const draft = liveDraft(shopId, draftId);
    if (!shop || !draft) return { ok: false, errors: { date: { code: CheckoutError.DraftIncomplete } } };

    const errors: FieldErrors<keyof typeof input> = { ...checkSlot(shop, input.date, input.slotId, draftId) };
    const recipientName = text(input.recipientName, LIMITS.name, true);
    if (recipientName.error) errors.recipientName = recipientName.error;
    const recipientPhone = phone(input.recipientPhone);
    if (recipientPhone.error) errors.recipientPhone = recipientPhone.error;
    const zone = deliveryZones.find((z) => z.shopId === shopId && z.id === input.zoneId && z.active);
    if (!zone) errors.zoneId = { code: CheckoutError.ZoneInvalid };
    // Bölge mahalle düzeyinde değilse mahalle adresin parçası olarak yazılır.
    const neighborhood = zone?.neighborhood ? { value: zone.neighborhood } : text(input.neighborhood, LIMITS.name, true);
    if (neighborhood.error) errors.neighborhood = neighborhood.error;
    const address = text(input.address, LIMITS.address, true);
    if (address.error) errors.address = address.error;
    const courierNote = text(input.courierNote, LIMITS.courierNote, false);
    if (courierNote.error) errors.courierNote = courierNote.error;
    if (hasErrors(errors) || !zone) return { ok: false, errors };

    const slot = timeSlots.find((s) => s.id === input.slotId)!;
    draft.delivery = {
      date: input.date,
      slotId: slot.id,
      slotStart: slot.start,
      slotEnd: slot.end,
      zoneId: zone.id,
      district: zone.district,
      neighborhood: neighborhood.value,
      fee: zone.fee,
      recipientName: recipientName.value,
      recipientPhone: recipientPhone.value!,
      address: address.value,
      courierNote: courierNote.value,
      reservedUntil: new Date(Date.now() + RESERVATION_MS).toISOString(),
    };
    Object.assign(draft, totals(draft));
    return { ok: true, value: copy(draft) };
  },

  async saveCard(shopId, draftId, input) {
    const draft = liveDraft(shopId, draftId);
    if (!draft) return { ok: false, errors: { message: { code: CheckoutError.DraftIncomplete } } };
    const errors: FieldErrors<keyof typeof input> = {};
    const message = text(input.message, LIMITS.cardNote, false);
    if (message.error) errors.message = message.error;
    const signature = text(input.signature, LIMITS.signature, false);
    if (signature.error) errors.signature = signature.error;
    const senderPhone = phone(input.senderPhone);
    if (senderPhone.error) errors.senderPhone = senderPhone.error;
    if (hasErrors(errors)) return { ok: false, errors };

    draft.card = {
      message: message.value,
      signature: input.anonymous ? "" : signature.value,
      anonymous: input.anonymous,
      senderPhone: senderPhone.value!,
    };
    return { ok: true, value: copy(draft) };
  },

  async placeOrder(shopId, draftId, input) {
    // Aynı anahtarla ikinci gönderim yeni sipariş açmaz, ilkini döner.
    const existing = getStore().idempotency.get(input.idempotencyKey);
    if (existing) return { ok: true, value: { trackingToken: existing } };

    const shop = shopById(shopId);
    const draft = liveDraft(shopId, draftId);
    if (!shop || !draft?.delivery || !draft.card) {
      return { ok: false, errors: { draft: { code: CheckoutError.DraftIncomplete } } };
    }
    const errors: FieldErrors<keyof typeof input> = {};
    const method = Object.values(PaymentMethod).find((m) => m === input.paymentMethod && m !== PaymentMethod.Cash);
    if (!method) errors.paymentMethod = { code: CheckoutError.PaymentMethodInvalid };
    if (!input.consent) errors.consent = { code: CheckoutError.ConsentRequired };
    if (hasErrors(errors) || !method) return { ok: false, errors };

    // Ödeme başlamadan ürün ve fiyat yeniden doğrulanır.
    const product = products.find((p) => p.shopId === shopId && p.id === draft.item.productId && p.active);
    if (!product) return { ok: false, errors: { draft: { code: CheckoutError.ProductUnavailable } } };
    const { item } = buildItem(product, draft.item.options.map((o) => o.id));
    if (!item) return { ok: false, errors: { draft: { code: CheckoutError.ProductUnavailable } } };
    if (item.lineTotal !== draft.item.lineTotal) {
      draft.item = item;
      Object.assign(draft, totals(draft));
      return { ok: false, errors: { draft: { code: CheckoutError.PriceChanged, meta: { total: draft.total } } } };
    }

    // Rezervasyonun süresi dolduysa aralık hâlâ boşsa yeniden alınır, değilse alıcı geri döner.
    const { delivery } = draft;
    const slotErrors = checkSlot(shop, delivery.date, delivery.slotId, draftId);
    if (hasErrors(slotErrors)) {
      const code = slotErrors.date?.code ?? CheckoutError.ReservationExpired;
      return { ok: false, errors: { draft: { code, meta: slotErrors.date?.meta } } };
    }

    const now = new Date().toISOString();
    const serial = getStore().nextNumber++;
    const order: Order = {
      id: `o_${serial}`,
      number: `T-${serial}`,
      shopId,
      customerId: upsertCustomer(shopId, draft.card.senderPhone, draft.card.signature).id,
      source: OrderSource.Link,
      status: OrderStatus.New,
      paymentStatus: method === PaymentMethod.Card ? PaymentStatus.Paid : PaymentStatus.Pending,
      paymentMethod: method,
      deliveryDate: delivery.date,
      timeSlotId: delivery.slotId,
      slotStart: delivery.slotStart,
      slotEnd: delivery.slotEnd,
      deliveryTime: null,
      exactTime: false,
      deliveryZoneId: delivery.zoneId,
      zoneName: `${delivery.neighborhood}, ${delivery.district}`,
      recipientName: delivery.recipientName,
      recipientPhone: delivery.recipientPhone,
      address: `${delivery.address}, ${delivery.neighborhood}, ${delivery.district}`,
      courierNote: delivery.courierNote || null,
      cardNote: draft.card.message || null,
      senderName: draft.card.signature || null,
      anonymous: draft.card.anonymous,
      items: [
        {
          id: `o_${serial}_i1`,
          orderId: `o_${serial}`,
          productId: draft.item.productId,
          productName: draft.item.productName,
          unitPrice: draft.item.unitPrice,
          quantity: 1,
          options: draft.item.options.map(({ name, kind, extraPrice }) => ({ name, kind, extraPrice })),
        },
      ],
      subtotal: draft.subtotal,
      deliveryFee: draft.deliveryFee,
      total: draft.total,
      deliveryPhotoUrl: null,
      createdAt: now,
      trackingToken: randomToken(),
      senderPhone: draft.card.senderPhone,
      courierName: null,
      events: [{ status: OrderStatus.New, at: now }],
    };
    getStore().orders.push(order);
    const key = slotKey(delivery.date, delivery.slotId);
    getStore().slotUsage.set(key, (getStore().slotUsage.get(key) ?? 0) + 1);
    getStore().idempotency.set(input.idempotencyKey, order.trackingToken);
    appendNotification({
      shopId,
      orderNumber: order.number,
      channel: "sms",
      text: `Sipariş onayı, ${order.number}`,
      recipient: order.senderPhone,
      delivered: true,
      providerResponse: null,
    });
    getStore().drafts.delete(draftId);
    return { ok: true, value: { trackingToken: order.trackingToken } };
  },

  async getOrderTracking(shopId, token) {
    const order = getStore().orders.find((o) => o.shopId === shopId && o.trackingToken === token);
    if (!order) return null;
    return copy({
      token: order.trackingToken,
      number: order.number,
      shopId: order.shopId,
      status: order.status,
      paymentStatus: order.paymentStatus,
      paymentMethod: order.paymentMethod,
      deliveryDate: order.deliveryDate,
      slotStart: order.slotStart,
      slotEnd: order.slotEnd,
      deliveryTime: order.deliveryTime,
      recipientName: order.recipientName,
      cardNote: order.cardNote,
      // İsimsiz gönderimde imza takip sayfasına hiç gönderilmez.
      signature: order.anonymous ? null : order.senderName,
      anonymous: order.anonymous,
      courierName: order.courierName,
      deliveryPhotoUrl: order.deliveryPhotoUrl,
      senderPhone: order.senderPhone,
      events: order.events,
    });
  },

  async findTrackingToken(shopId, { number, phone: phoneInput }) {
    const wanted = number.trim().toUpperCase().replace(/^(T-?)?/, "T-");
    const normalized = normalizePhone(phoneInput);
    if (!normalized) return null;
    const order = getStore().orders.find(
      (o) => o.shopId === shopId && o.number === wanted && normalizePhone(o.senderPhone) === normalized,
    );
    return order?.trackingToken ?? null;
  },
};
