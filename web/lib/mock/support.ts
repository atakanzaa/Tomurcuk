// Müşteri hizmetleri panelinin mock backend'i. Kişisel veri maskeli döner; açmak
// gerekçe ister ve denetim kaydına yazılır. Destek erişimi her zaman loglanır.
import type { TomurcukApi } from "@/lib/api/contract";
import {
  CheckoutError,
  OrderSource,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  ShopRole,
  TicketCategory,
  TicketPriority,
  TicketStatus,
  type FieldErrors,
  type Order,
  type ShopSummary,
  type SupportOrderView,
  type TicketSummary,
  type TimelineEvent,
} from "@/lib/api/types";
import { formatPrice, zonedNow } from "@/lib/format";
import { maskPhone, shortName } from "@/lib/mask";
import { normalizePhone } from "@/lib/phone";
import { shops } from "./data";
import { appendAudit, appendNotification, getStore, randomToken, supportUserName, type StoredTicket } from "./store";
import { cannedReplies, CURRENT_SUPPORT_USER_ID, shopFacts, supportUsers } from "./support-data";

const copy = <T>(value: T): T => structuredClone(value);
const IMPERSONATION_MINUTES = 30;
const currentUser = () => supportUsers.find((u) => u.id === CURRENT_SUPPORT_USER_ID)!;
const shopById = (id: string) => shops.find((s) => s.id === id);
const districtOf = (address: string) => address.split(",").at(-1)?.trim() ?? "";
const todayOf = (timeZone: string) => zonedNow(new Date(), timeZone).date;

function toSummary(ticket: StoredTicket): TicketSummary {
  const shop = shopById(ticket.shopId);
  const order = ticket.orderId ? getStore().orders.find((o) => o.id === ticket.orderId) : undefined;
  // Bugün teslim edilecek siparişe bağlı talep kendiliğinden acil olur.
  const dueToday = order && shop && order.deliveryDate === todayOf(shop.timeZone);
  const { messages, ...rest } = ticket;
  return {
    ...rest,
    priority: dueToday && ticket.status !== TicketStatus.Resolved ? TicketPriority.Urgent : ticket.priority,
    shopName: shop?.name ?? "",
    shopDistrict: shop ? districtOf(shop.address) : "",
    assigneeName: supportUserName(ticket.assigneeId),
    orderDate: order?.deliveryDate ?? null,
    orderSlot: order ? { start: order.slotStart, end: order.slotEnd } : null,
  };
}

function timeline(order: Order): TimelineEvent[] {
  const state = getStore();
  const owner = state.shopUsers.find((u) => u.shopId === order.shopId && u.role === ShopRole.Owner)?.name ?? "Dükkân";
  const statusText: Partial<Record<OrderStatus, string>> = {
    [OrderStatus.Preparing]: "Hazırlanıyor olarak işaretlendi",
    [OrderStatus.OnWay]: "Yola çıktı",
    [OrderStatus.Delivered]: "Teslim edildi",
    [OrderStatus.Failed]: "Teslim edilemedi",
    [OrderStatus.Cancelled]: "İptal edildi",
  };
  const events: TimelineEvent[] = order.events.flatMap((e) => {
    if (e.status === OrderStatus.New) {
      const fromLink = order.source === OrderSource.Link;
      const created = { at: e.at, text: fromLink ? "Sipariş linkten alındı" : "Sipariş elle girildi", actor: fromLink ? "Alıcı akışı" : `${owner}, dükkân`, failed: false };
      const paid =
        order.paymentStatus === PaymentStatus.Paid && order.paymentMethod === PaymentMethod.Card
          ? [{ at: new Date(Date.parse(e.at) + 60_000).toISOString(), text: `Ödeme onaylandı, ${formatPrice(order.total)}`, actor: "iyzico", failed: false }]
          : [];
      return [created, ...paid];
    }
    const actor = e.status === OrderStatus.OnWay && order.courierName ? `${owner}, kurye ${order.courierName}` : `${owner}, dükkân`;
    return [{ at: e.at, text: statusText[e.status] ?? "", actor, failed: e.status === OrderStatus.Failed }];
  });
  const notifications = state.notifications
    .filter((n) => n.orderNumber === order.number)
    .map((n) => ({
      at: n.at,
      text: `${n.channel === "sms" ? "SMS" : "E-posta"}: ${n.text.split(",")[0].toLocaleLowerCase("tr")}, ${n.delivered ? "iletildi" : "iletilemedi"}`,
      actor: n.delivered ? "Sistem" : `Sağlayıcı yanıtı: ${n.providerResponse?.toLocaleLowerCase("tr") ?? "bilinmiyor"}`,
      failed: !n.delivered,
    }));
  return [...events, ...notifications].sort((a, b) => a.at.localeCompare(b.at));
}

function toOrderView(order: Order): SupportOrderView {
  const sender = getStore().customers.find((c) => c.id === order.customerId);
  return {
    id: order.id,
    number: order.number,
    status: order.status,
    paymentStatus: order.paymentStatus,
    paymentMethod: order.paymentMethod,
    deliveryDate: order.deliveryDate,
    slotStart: order.slotStart,
    slotEnd: order.slotEnd,
    recipientName: shortName(order.recipientName),
    recipientPhone: maskPhone(order.recipientPhone),
    address: [order.address, order.zoneName].filter(Boolean).join(", "),
    senderName: sender ? shortName(sender.name) : "",
    senderPhone: maskPhone(order.senderPhone),
    total: order.total,
    timeline: timeline(order),
  };
}

function shopSummary(shopId: string): ShopSummary | null {
  const shop = shopById(shopId);
  if (!shop) return null;
  const state = getStore();
  const facts = shopFacts[shopId];
  const lastActivity = state.shopUsers
    .filter((u) => u.shopId === shopId)
    .map((u) => u.lastSeenAt)
    .filter((v): v is string => Boolean(v))
    .sort()
    .at(-1);
  return {
    shop,
    district: districtOf(shop.address),
    since: facts?.since ?? "",
    monthlyOrders: facts?.monthlyOrders ?? 0,
    openTickets: state.tickets.filter((t) => t.shopId === shopId && t.status !== TicketStatus.Resolved).length,
    lastActivityAt: lastActivity ?? null,
  };
}

type SupportApi = Pick<
  TomurcukApi,
  | "getSupportUser"
  | "getSupportUsers"
  | "getTickets"
  | "getTicket"
  | "replyToTicket"
  | "escalateTicket"
  | "revealPhone"
  | "getShopSummaries"
  | "getShopOverview"
  | "addShopNote"
  | "startImpersonation"
  | "endImpersonation"
  | "searchSupport"
  | "getAuditLog"
  | "getCannedReplies"
  | "getSupportOrders"
  | "submitPilotApplication"
  | "getShopTickets"
  | "createTicket"
>;

export const mockSupportApi: SupportApi = {
  async getSupportUser() {
    return copy(currentUser());
  },

  async getSupportUsers() {
    return copy(supportUsers);
  },

  async getTickets() {
    return getStore()
      .tickets.map(toSummary)
      .sort((a, b) => {
        if (a.status === TicketStatus.Resolved !== (b.status === TicketStatus.Resolved)) return a.status === TicketStatus.Resolved ? 1 : -1;
        if (a.priority !== b.priority) return a.priority === TicketPriority.Urgent ? -1 : 1;
        return a.waitingSince.localeCompare(b.waitingSince);
      });
  },

  async getTicket(ticketId) {
    const ticket = getStore().tickets.find((t) => t.id === ticketId);
    if (!ticket) return null;
    const order = ticket.orderId ? getStore().orders.find((o) => o.id === ticket.orderId) : undefined;
    return copy({ ...toSummary(ticket), messages: ticket.messages, order: order ? toOrderView(order) : null });
  },

  async replyToTicket(ticketId, { text, internal, waitForShop }) {
    const ticket = getStore().tickets.find((t) => t.id === ticketId);
    const body = text.trim();
    const errors: FieldErrors<"text"> = {};
    if (!ticket) errors.text = { code: CheckoutError.DraftIncomplete };
    else if (!body) errors.text = { code: CheckoutError.Required };
    else if (body.length > 4000) errors.text = { code: CheckoutError.TooLong, meta: { max: 4000 } };
    if (!ticket || Object.keys(errors).length) return { ok: false, errors };
    const user = currentUser();
    const now = new Date().toISOString();
    ticket.messages.push({
      id: `${ticket.id}_m${ticket.messages.length + 1}`,
      authorName: user.name,
      authorOrg: internal ? "dahili not, dükkân görmez" : "Tomurcuk Destek",
      internal,
      text: body,
      at: now,
    });
    if (!internal) {
      ticket.firstResponseAt ??= now;
      ticket.assigneeId ??= user.id;
      ticket.status = waitForShop ? TicketStatus.WaitingShop : TicketStatus.Open;
      ticket.waitingSince = now;
    }
    return { ok: true, value: true };
  },

  async escalateTicket(ticketId) {
    const ticket = getStore().tickets.find((t) => t.id === ticketId);
    const lead = supportUsers.find((u) => u.role === "lead");
    if (!ticket || !lead) return false;
    ticket.assigneeId = lead.id;
    appendAudit({
      actorName: currentUser().name,
      shopName: shopById(ticket.shopId)?.name ?? null,
      action: "Talep lidere aktarıldı",
      record: ticket.subject,
      reason: null,
    });
    return true;
  },

  async revealPhone(orderId, field, reason) {
    const order = getStore().orders.find((o) => o.id === orderId);
    if (!order || !reason.trim()) return null;
    appendAudit({
      actorName: currentUser().name,
      shopName: shopById(order.shopId)?.name ?? null,
      action: "Telefon görüntülendi",
      record: `Sipariş ${order.number}, ${field === "recipient" ? "alıcı" : "gönderen"} telefonu`,
      reason: reason.trim(),
    });
    return field === "recipient" ? order.recipientPhone : order.senderPhone;
  },

  async getShopSummaries() {
    return shops.map((s) => shopSummary(s.id)).filter((s): s is ShopSummary => Boolean(s));
  },

  async getShopOverview(shopId) {
    const summary = shopSummary(shopId);
    if (!summary) return null;
    const state = getStore();
    const facts = shopFacts[shopId];
    const users = state.shopUsers.filter((u) => u.shopId === shopId);
    const lastUser = [...users].sort((a, b) => (b.lastSeenAt ?? "").localeCompare(a.lastSeenAt ?? ""))[0];
    return copy({
      ...summary,
      paymentAccount: facts?.paymentAccount ?? "Tanımlı değil",
      lastLogin: lastUser?.lastSeenAt ? { at: lastUser.lastSeenAt, userName: lastUser.name } : null,
      recentOrders: state.orders
        .filter((o) => o.shopId === shopId)
        .sort((a, b) => b.deliveryDate.localeCompare(a.deliveryDate) || b.createdAt.localeCompare(a.createdAt))
        .slice(0, 6)
        .map(toOrderView),
      notifications: state.notifications
        .filter((n) => n.shopId === shopId)
        .sort((a, b) => b.at.localeCompare(a.at))
        .map((n) => ({ ...n, recipient: /\d/.test(n.recipient) ? maskPhone(n.recipient) : n.recipient })),
      smsUsed: facts?.smsUsed ?? 0,
      smsLimit: facts?.smsLimit ?? 0,
      notes: state.notes.filter((n) => n.shopId === shopId).sort((a, b) => b.at.localeCompare(a.at)),
      users,
      tickets: state.tickets.filter((t) => t.shopId === shopId && t.status !== TicketStatus.Resolved).map(toSummary),
    });
  },

  async addShopNote(shopId, text) {
    const body = text.trim();
    if (!body) return { ok: false, errors: { text: { code: CheckoutError.Required } } };
    if (body.length > 1000) return { ok: false, errors: { text: { code: CheckoutError.TooLong, meta: { max: 1000 } } } };
    const user = currentUser();
    getStore().notes.unshift({ id: `sn_${randomToken(6)}`, shopId, authorName: shortName(user.name), text: body, at: new Date().toISOString() });
    return { ok: true, value: true };
  },

  async startImpersonation(shopId, reason) {
    const shop = shopById(shopId);
    if (!shop || !reason.trim()) return null;
    const user = currentUser();
    const start = new Date();
    const impersonation = {
      id: randomToken(20),
      supportUserName: user.name,
      shopId,
      reason: reason.trim(),
      startedAt: start.toISOString(),
      endsAt: new Date(start.getTime() + IMPERSONATION_MINUTES * 60_000).toISOString(),
    };
    getStore().impersonations.set(impersonation.id, impersonation);
    appendAudit({ actorName: user.name, shopName: shop.name, action: "Dükkân adına giriş", record: `${IMPERSONATION_MINUTES} dakikalık oturum`, reason: impersonation.reason });
    // Dükkân sahibine bildirim gider.
    appendNotification({
      shopId,
      orderNumber: null,
      channel: "email",
      text: `Destek ekibi panelinize girdi: ${user.name}`,
      recipient: "dükkân sahibi",
      delivered: true,
      providerResponse: null,
    });
    return copy(impersonation);
  },

  async endImpersonation(impersonationId) {
    const state = getStore();
    const impersonation = state.impersonations.get(impersonationId);
    if (!impersonation) return;
    state.impersonations.delete(impersonationId);
    appendAudit({
      actorName: impersonation.supportUserName,
      shopName: shopById(impersonation.shopId)?.name ?? null,
      action: "Dükkân adına giriş bitirildi",
      record: "Oturum kapatıldı",
      reason: null,
    });
  },

  async searchSupport(query) {
    const q = query.trim().toLocaleLowerCase("tr");
    if (q.length < 2) return { orders: [], shops: [], tickets: [] };
    const state = getStore();
    const digits = q.replace(/\D/g, "");
    const phoneMatch = (phone: string) => digits.length >= 4 && (normalizePhone(phone) ?? "").includes(digits.replace(/^0/, ""));
    const orders = state.orders
      .filter(
        (o) =>
          o.number.toLocaleLowerCase("tr").includes(q) ||
          o.recipientName.toLocaleLowerCase("tr").includes(q) ||
          phoneMatch(o.recipientPhone) ||
          phoneMatch(o.senderPhone),
      )
      .slice(0, 20)
      .map((o) => ({ ...toOrderView(o), shopName: shopById(o.shopId)?.name ?? "" }));
    const shopResults = shops
      .filter((s) => s.name.toLocaleLowerCase("tr").includes(q) || phoneMatch(s.phone))
      .map((s) => shopSummary(s.id)!)
      .filter(Boolean);
    const tickets = state.tickets.filter((t) => t.subject.toLocaleLowerCase("tr").includes(q)).map(toSummary);
    appendAudit({ actorName: currentUser().name, shopName: null, action: "Global arama", record: `"${query.trim()}"`, reason: null });
    return copy({ orders, shops: shopResults, tickets });
  },

  async getAuditLog() {
    return copy(getStore().audit);
  },

  async getCannedReplies() {
    return copy(cannedReplies);
  },

  async getSupportOrders() {
    return getStore()
      .orders.filter((o) => o.deliveryDate >= todayOf("Europe/Istanbul") || o.status !== OrderStatus.Delivered)
      .sort((a, b) => a.deliveryDate.localeCompare(b.deliveryDate) || a.slotStart.localeCompare(b.slotStart))
      .map((o) => ({ ...toOrderView(o), shopName: shopById(o.shopId)?.name ?? "" }));
  },

  async getShopTickets(shopId) {
    return getStore()
      .tickets.filter((t) => t.shopId === shopId)
      .map(toSummary)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async createTicket(shopId, input) {
    const state = getStore();
    const errors: FieldErrors<keyof typeof input> = {};
    const category = Object.values(TicketCategory).find((c) => c === input.category);
    if (!category) errors.category = { code: CheckoutError.Required };
    if (!input.subject.trim()) errors.subject = { code: CheckoutError.Required };
    else if (input.subject.length > 120) errors.subject = { code: CheckoutError.TooLong, meta: { max: 120 } };
    if (!input.text.trim()) errors.text = { code: CheckoutError.Required };
    const number = input.orderNumber.trim().toUpperCase().replace(/^(T-?)?(?=\d)/, "T-");
    const order = number ? state.orders.find((o) => o.shopId === shopId && o.number === number) : undefined;
    if (number && !order) errors.orderNumber = { code: CheckoutError.OptionInvalid };
    if (Object.keys(errors).length || !category) return { ok: false, errors };
    const owner = state.shopUsers.find((u) => u.shopId === shopId && u.role === ShopRole.Owner);
    const now = new Date().toISOString();
    const id = `tk_${1200 + state.tickets.length}`;
    state.tickets.unshift({
      id,
      subject: input.subject.trim(),
      shopId,
      orderId: order?.id ?? null,
      orderNumber: order?.number ?? null,
      category,
      priority: TicketPriority.Normal,
      status: TicketStatus.Open,
      assigneeId: null,
      createdAt: now,
      waitingSince: now,
      firstResponseAt: null,
      messages: [
        { id: `${id}_m1`, authorName: owner?.name ?? "Dükkân", authorOrg: shopById(shopId)?.name ?? "", internal: false, text: input.text.trim(), at: now },
      ],
    });
    return { ok: true, value: { ticketId: id } };
  },

  async submitPilotApplication(input) {
    const errors: FieldErrors<keyof typeof input> = {};
    if (!input.shopName.trim()) errors.shopName = { code: CheckoutError.Required };
    if (!input.phone.trim()) errors.phone = { code: CheckoutError.Required };
    else if (!normalizePhone(input.phone)) errors.phone = { code: CheckoutError.PhoneInvalid };
    if (!input.district.trim()) errors.district = { code: CheckoutError.Required };
    if (input.instagram.length > 60) errors.instagram = { code: CheckoutError.TooLong, meta: { max: 60 } };
    if (Object.keys(errors).length) return { ok: false, errors };
    getStore().pilotApplications.push({ ...input, at: new Date().toISOString() });
    return { ok: true, value: true };
  },
};
