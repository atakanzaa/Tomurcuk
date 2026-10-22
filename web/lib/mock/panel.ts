// Satıcı panelinin mock backend'i. Her sorgu shopId ile sınırlıdır (kiracı izolasyonu).
import type { TomurcukApi } from "@/lib/api/contract";
import {
  CheckoutError,
  OrderSource,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  ShopRole,
  type Customer,
  type CustomerSummary,
  type FieldErrors,
  type ManualOrderInput,
  type Order,
} from "@/lib/api/types";
import { addDays, daysBetween } from "@/lib/dates";
import { zonedNow } from "@/lib/format";
import { canTransition } from "@/lib/order-flow";
import { formatPhone, normalizePhone } from "@/lib/phone";
import { detectZone } from "@/lib/zones";
import { deliveryZones, products, remainingBySlot, shops, timeSlots } from "./data";
import { appendNotification, getStore, randomToken } from "./store";

const copy = <T>(value: T): T => structuredClone(value);
const CURRENT_SHOP_USER_ID = "su_ayla";
/** Elle girilen sipariş için en uzak tarih. */
const MANUAL_WINDOW_DAYS = 60;

function summarize(customer: Customer): CustomerSummary {
  const orders = getStore().orders.filter(
    (o) => o.customerId === customer.id && o.status !== OrderStatus.Cancelled,
  );
  return {
    ...customer,
    orderCount: orders.length,
    totalSpent: orders.reduce((sum, o) => sum + o.total, 0),
    lastOrderAt: orders.map((o) => o.createdAt).sort().at(-1) ?? null,
  };
}

/** Dükkân + telefon tekildir; aynı numara farklı isimle gelirse mevcut kart kullanılır. */
export function upsertCustomer(shopId: string, phone: string, name: string): Customer {
  const state = getStore();
  const normalized = normalizePhone(phone);
  const existing = state.customers.find((c) => c.shopId === shopId && normalizePhone(c.phone) === normalized);
  if (existing) return existing;
  const customer: Customer = {
    id: `cu_${randomToken(8)}`,
    shopId,
    name: name.trim() || "İsimsiz müşteri",
    phone,
    email: null,
    note: null,
    marketingConsent: false,
  };
  state.customers.push(customer);
  return customer;
}

function notifyStatus(order: Order) {
  const shopId = order.shopId;
  const base = { shopId, orderNumber: order.number, channel: "sms" as const, delivered: true, providerResponse: null };
  if (order.status === OrderStatus.OnWay) {
    appendNotification({ ...base, text: `Sipariş yolda, ${order.number}`, recipient: order.recipientPhone });
  }
  if (order.status === OrderStatus.Delivered || order.status === OrderStatus.Failed) {
    const text = order.status === OrderStatus.Delivered ? "Teslim edildi" : "Teslim edilemedi";
    appendNotification({ ...base, text: `${text}, ${order.number}`, recipient: order.senderPhone });
  }
}

const today = (shopId: string) => zonedNow(new Date(), shops.find((s) => s.id === shopId)?.timeZone ?? "Europe/Istanbul");

type PanelApi = Pick<
  TomurcukApi,
  | "getPanelSession"
  | "getOrder"
  | "updateOrderStatus"
  | "markOrderPaid"
  | "getCustomers"
  | "getCustomer"
  | "findCustomerByPhone"
  | "getReminders"
  | "createManualOrder"
>;

export const mockPanelApi: PanelApi = {
  async getPanelSession(impersonationId) {
    const state = getStore();
    const impersonation = impersonationId ? state.impersonations.get(impersonationId) : undefined;
    const active = impersonation && Date.parse(impersonation.endsAt) > Date.now() ? impersonation : null;
    if (active) {
      // Destek oturumunda dükkân sahibinin değil, temsilcinin yetkisi geçerlidir: iptal ve
      // ödeme hesabı gibi işler kapalıdır (çalışan düzeyi).
      const shop = shops.find((s) => s.id === active.shopId)!;
      const user = {
        id: `support:${active.id}`,
        shopId: shop.id,
        name: active.supportUserName,
        email: "",
        role: ShopRole.Staff,
        lastSeenAt: null,
      };
      return copy({ shop, user, impersonation: active });
    }
    const user = state.shopUsers.find((u) => u.id === CURRENT_SHOP_USER_ID)!;
    const shop = shops.find((s) => s.id === user.shopId)!;
    return copy({ shop, user, impersonation: null });
  },

  async getOrder(shopId, orderId) {
    const order = getStore().orders.find((o) => o.shopId === shopId && o.id === orderId);
    return order ? copy(order) : null;
  },

  async updateOrderStatus(shopId, orderId, status) {
    const order = getStore().orders.find((o) => o.shopId === shopId && o.id === orderId);
    if (!order || !canTransition(order.status, status)) {
      return { ok: false, errors: { status: { code: CheckoutError.DraftIncomplete } } };
    }
    order.status = status;
    order.events.push({ status, at: new Date().toISOString() });
    if (status === OrderStatus.Delivered) order.deliveryTime = today(shopId).time;
    notifyStatus(order);
    return { ok: true, value: copy(order) };
  },

  async markOrderPaid(shopId, orderId) {
    const order = getStore().orders.find((o) => o.shopId === shopId && o.id === orderId);
    if (!order) return { ok: false, errors: { payment: { code: CheckoutError.DraftIncomplete } } };
    order.paymentStatus = PaymentStatus.Paid;
    return { ok: true, value: copy(order) };
  },

  async getCustomers(shopId, filter) {
    const query = filter?.query?.trim().toLocaleLowerCase("tr") ?? "";
    const digits = query.replace(/\D/g, "");
    return getStore()
      .customers.filter((c) => c.shopId === shopId)
      .filter(
        (c) =>
          !query ||
          c.name.toLocaleLowerCase("tr").includes(query) ||
          (digits.length >= 3 && c.phone.replace(/\D/g, "").includes(digits)),
      )
      .map(summarize)
      .sort((a, b) => (b.lastOrderAt ?? "").localeCompare(a.lastOrderAt ?? ""));
  },

  async getCustomer(shopId, customerId) {
    const state = getStore();
    const customer = state.customers.find((c) => c.shopId === shopId && c.id === customerId);
    if (!customer) return null;
    return copy({
      customer: summarize(customer),
      orders: state.orders
        .filter((o) => o.customerId === customer.id)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
      specialDays: state.specialDays.filter((d) => d.customerId === customer.id),
    });
  },

  async findCustomerByPhone(shopId, phone) {
    const normalized = normalizePhone(phone);
    if (!normalized) return null;
    const state = getStore();
    const customer = state.customers.find((c) => c.shopId === shopId && normalizePhone(c.phone) === normalized);
    if (!customer) return null;
    const lastOrder =
      state.orders
        .filter((o) => o.customerId === customer.id)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0] ?? null;
    return copy({ ...summarize(customer), lastOrder });
  },

  async getReminders(shopId, days) {
    const state = getStore();
    const now = today(shopId);
    const year = Number(now.date.slice(0, 4));
    const isLeap = (y: number) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
    const occurrence = (day: number, month: number, y: number) => {
      // 29 Şubat artık yıl olmayan yıllarda 28 Şubat'ta hatırlatılır.
      const d = month === 2 && day === 29 && !isLeap(y) ? 28 : day;
      return `${y}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    };
    return state.specialDays
      .map((specialDay) => {
        const thisYear = occurrence(specialDay.day, specialDay.month, year);
        const date = daysBetween(now.date, thisYear) < 0 ? occurrence(specialDay.day, specialDay.month, year + 1) : thisYear;
        return { specialDay, date };
      })
      .filter(({ date }) => daysBetween(now.date, date) <= days)
      .flatMap(({ specialDay, date }) => {
        const customer = state.customers.find((c) => c.id === specialDay.customerId && c.shopId === shopId);
        if (!customer) return [];
        const lastYearDate = addDays(date, -365);
        const lastYearOrder = state.orders.find(
          (o) => o.customerId === customer.id && Math.abs(daysBetween(lastYearDate, o.deliveryDate)) <= 3,
        );
        return [
          {
            specialDay,
            customer: summarize(customer),
            date,
            lastYear: lastYearOrder
              ? { productName: lastYearOrder.items[0]?.productName ?? "", total: lastYearOrder.total }
              : null,
          },
        ];
      })
      .sort((a, b) => a.date.localeCompare(b.date));
  },

  async createManualOrder(shopId, input) {
    const state = getStore();
    const errors: FieldErrors<keyof ManualOrderInput> = {};
    const source = Object.values(OrderSource).find((s) => s === input.source && s !== OrderSource.Link);
    if (!source) errors.source = { code: CheckoutError.Required };
    const customerPhone = normalizePhone(input.customerPhone);
    if (!input.customerPhone.trim()) errors.customerPhone = { code: CheckoutError.Required };
    else if (!customerPhone) errors.customerPhone = { code: CheckoutError.PhoneInvalid };

    const lines = input.items.flatMap((line) => {
      const product = products.find((p) => p.shopId === shopId && p.id === line.productId && p.active);
      const option = product?.options.find((o) => o.id === line.optionId) ?? null;
      if (!product || line.quantity < 1 || line.quantity > 20) return [];
      return [{ product, option, quantity: line.quantity }];
    });
    if (lines.length === 0 || lines.length !== input.items.length) errors.items = { code: CheckoutError.OptionInvalid };

    const now = today(shopId);
    const offset = daysBetween(now.date, input.date);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date) || offset < 0 || offset > MANUAL_WINDOW_DAYS) {
      errors.date = { code: CheckoutError.DateOutOfRange };
    }
    const slot = timeSlots.find((s) => s.shopId === shopId && s.id === input.slotId);
    const exact = input.slotId === "exact";
    if (!slot && !exact) errors.slotId = { code: CheckoutError.Required };
    if (exact && !/^([01]\d|2[0-3]):[0-5]\d$/.test(input.exactTime)) errors.exactTime = { code: CheckoutError.Required };
    if (slot) {
      const used = state.slotUsage.get(`${input.date}|${slot.id}`) ?? 0;
      if ((remainingBySlot[slot.id] ?? slot.capacity) - used <= 0) {
        errors.slotId = { code: CheckoutError.SlotFull, meta: { single: 1 } };
      }
    }
    if (!input.recipientName.trim()) errors.recipientName = { code: CheckoutError.Required };
    const recipientPhone = normalizePhone(input.recipientPhone);
    if (!input.recipientPhone.trim()) errors.recipientPhone = { code: CheckoutError.Required };
    else if (!recipientPhone) errors.recipientPhone = { code: CheckoutError.PhoneInvalid };
    const zone = detectZone(deliveryZones.filter((z) => z.shopId === shopId), input.address);
    if (!input.address.trim()) errors.address = { code: CheckoutError.Required };
    else if (!zone) errors.address = { code: CheckoutError.ZoneInvalid };
    if (input.cardNote.length > 250) errors.cardNote = { code: CheckoutError.TooLong, meta: { max: 250 } };
    const payment = { paid: PaymentStatus.Paid, cash: PaymentStatus.Pending, transfer: PaymentStatus.Pending }[
      input.payment as "paid" | "cash" | "transfer"
    ];
    if (!payment) errors.payment = { code: CheckoutError.PaymentMethodInvalid };
    if (Object.keys(errors).length || !zone || !customerPhone || !recipientPhone) return { ok: false, errors };

    const customer = upsertCustomer(shopId, formatPhone(customerPhone), input.customerName);
    const serial = state.nextNumber++;
    const subtotal = lines.reduce((sum, l) => sum + (l.product.price + (l.option?.extraPrice ?? 0)) * l.quantity, 0);
    const createdAt = new Date().toISOString();
    const startEnd = slot ? { slotStart: slot.start, slotEnd: slot.end } : { slotStart: input.exactTime, slotEnd: input.exactTime };
    const order: Order = {
      id: `o_${serial}`,
      number: `T-${serial}`,
      shopId,
      customerId: customer.id,
      source: source!,
      status: OrderStatus.New,
      paymentStatus: payment!,
      paymentMethod: input.payment === "transfer" ? PaymentMethod.Transfer : PaymentMethod.Cash,
      deliveryDate: input.date,
      timeSlotId: slot?.id ?? null,
      ...startEnd,
      deliveryTime: exact ? input.exactTime : null,
      exactTime: exact,
      deliveryZoneId: zone.id,
      zoneName: zone.neighborhood ? `${zone.neighborhood}, ${zone.district}` : zone.district,
      recipientName: input.recipientName.trim(),
      recipientPhone: formatPhone(recipientPhone),
      address: input.address.trim(),
      courierNote: null,
      cardNote: input.cardNote.trim() || null,
      senderName: null,
      anonymous: false,
      items: lines.map((l, i) => ({
        id: `o_${serial}_i${i + 1}`,
        orderId: `o_${serial}`,
        productId: l.product.id,
        productName: l.product.name,
        unitPrice: l.product.price,
        quantity: l.quantity,
        options: l.option ? [{ name: l.option.name, kind: l.option.kind, extraPrice: l.option.extraPrice }] : [],
      })),
      subtotal,
      deliveryFee: zone.fee,
      total: subtotal + zone.fee,
      deliveryPhotoUrl: null,
      createdAt,
      trackingToken: randomToken(),
      senderPhone: customer.phone,
      courierName: null,
      events: [{ status: OrderStatus.New, at: createdAt }],
    };
    state.orders.push(order);
    if (slot) {
      const key = `${input.date}|${slot.id}`;
      state.slotUsage.set(key, (state.slotUsage.get(key) ?? 0) + 1);
    }
    return { ok: true, value: { orderId: order.id } };
  },
};
