import {
  OrderStatus,
  type AuditEntry,
  type Customer,
  type Impersonation,
  type NotificationLog,
  type Order,
  type PilotApplicationInput,
  type ShopUser,
  type SpecialDay,
  type SupportNote,
  type TicketMessage,
  type TicketSummary,
} from "@/lib/api/types";
import { addDays, daysBetween } from "@/lib/dates";
import { zonedNow } from "@/lib/format";
import { BASE_DATE, customers, orders as seedOrders, shopUsers, shops, specialDaySeeds } from "./data";
import { noteSeeds, supportUsers, ticketSeeds } from "./support-data";

export interface StoredTicket extends Omit<TicketSummary, "shopName" | "shopDistrict" | "assigneeName" | "orderDate" | "orderSlot"> {
  messages: TicketMessage[];
}

interface MockState {
  orders: Order[];
  customers: Customer[];
  specialDays: SpecialDay[];
  shopUsers: ShopUser[];
  tickets: StoredTicket[];
  notifications: NotificationLog[];
  notes: SupportNote[];
  audit: AuditEntry[];
  impersonations: Map<string, Impersonation>;
  pilotApplications: (PilotApplicationInput & { at: string })[];
}

// Geliştirmede modüller yeniden yüklendiğinde veri kaybolmasın diye globalThis'te tutulur.
// Tek süreçli çalışır; backend gelince bu dosya tamamen kalkar.
const globalForMock = globalThis as typeof globalThis & { __tomurcukMock?: MockState };

/**
 * Depo ilk istekte kurulur. Tasarımlardaki taban gün (22 Ekim) gerçek bugüne kaydırılır;
 * böylece "Bugün" ekranı, takip sayfaları ve hatırlatmalar her gün dolu görünür.
 */
export function getStore(): MockState {
  return (globalForMock.__tomurcukMock ??= createState(new Date()));
}

function createState(now: Date): MockState {
  const timeZone = shops[0].timeZone;
  const shift = daysBetween(BASE_DATE, zonedNow(now, timeZone).date);
  const shiftIso = (iso: string) => new Date(Date.parse(iso) + shift * 86_400_000).toISOString();
  const minutesAgo = (minutes: number) => new Date(now.getTime() - minutes * 60_000).toISOString();

  const orders = structuredClone(seedOrders).map((order) => ({
    ...order,
    deliveryDate: addDays(order.deliveryDate, shift),
    createdAt: shiftIso(order.createdAt),
    events: order.events.map((e) => ({ ...e, at: shiftIso(e.at) })),
  }));

  const specialDays = specialDaySeeds.map(({ dayOffset, ...seed }) => {
    const date = addDays(BASE_DATE, dayOffset + shift);
    return { ...seed, day: Number(date.slice(8, 10)), month: Number(date.slice(5, 7)) };
  });

  const tickets = ticketSeeds.map((seed) => ({
    id: seed.id,
    subject: seed.subject,
    shopId: seed.shopId,
    orderId: seed.orderId,
    orderNumber: seed.orderNumber,
    category: seed.category,
    priority: seed.priority,
    status: seed.status,
    assigneeId: seed.assigneeId,
    createdAt: minutesAgo(seed.createdMinutesAgo),
    waitingSince: minutesAgo(seed.waitingMinutesAgo),
    firstResponseAt: seed.firstResponseMinutesAgo === null ? null : minutesAgo(seed.firstResponseMinutesAgo),
    messages: seed.messages.map((m, i) => ({
      id: `${seed.id}_m${i + 1}`,
      authorName: m.author,
      authorOrg: m.org,
      internal: m.internal,
      text: m.text,
      at: minutesAgo(m.minutesAgo),
    })),
  }));

  const eventAt = (orderId: string, status: OrderStatus) =>
    orders.find((o) => o.id === orderId)?.events.find((e) => e.status === status)?.at ?? now.toISOString();
  const plusMinute = (iso: string) => new Date(Date.parse(iso) + 60_000).toISOString();
  const todayAt = (time: string) => new Date(`${zonedNow(now, timeZone).date}T${time}:00+03:00`).toISOString();

  const notifications: NotificationLog[] = [
    {
      id: "nl_1",
      shopId: "shop_nergis",
      orderNumber: "T-4816",
      channel: "sms",
      text: "Sipariş yolda, T-4816",
      recipient: "0541 330 52 03",
      delivered: false,
      providerResponse: "Abone ulaşılamıyor",
      at: plusMinute(eventAt("o_4816", OrderStatus.OnWay)),
    },
    {
      id: "nl_2",
      shopId: "shop_nergis",
      orderNumber: "T-4817",
      channel: "sms",
      text: "Teslim edildi, T-4817",
      recipient: "0505 412 60 47",
      delivered: true,
      providerResponse: null,
      at: plusMinute(eventAt("o_4817", OrderStatus.Delivered)),
    },
    {
      id: "nl_3",
      shopId: "shop_nergis",
      orderNumber: "T-4816",
      channel: "sms",
      text: "Sipariş onayı, T-4816",
      recipient: "0541 220 31 03",
      delivered: true,
      providerResponse: null,
      at: plusMinute(eventAt("o_4816", OrderStatus.New)),
    },
    {
      id: "nl_4",
      shopId: "shop_nergis",
      orderNumber: null,
      channel: "email",
      text: "Günün siparişleri özeti",
      recipient: "dükkân sahibi",
      delivered: true,
      providerResponse: null,
      at: todayAt("09:00"),
    },
  ];

  const notes = noteSeeds.map(({ dayOffset, ...note }) => ({
    ...note,
    at: new Date(`${addDays(BASE_DATE, dayOffset + shift)}T11:00:00+03:00`).toISOString(),
  }));

  const audit: AuditEntry[] = [
    {
      id: "au_1",
      actorName: "Mert Arslan",
      shopName: "Begonvil Atölye",
      action: "Dükkân adına giriş",
      record: "30 dakikalık oturum",
      reason: "Dükkân telefonda yardım istedi",
      at: minutesAgo(26 * 60),
    },
    {
      id: "au_2",
      actorName: "Selin Karaca",
      shopName: "Nergis Çiçek Atölyesi",
      action: "Telefon görüntülendi",
      record: "Sipariş T-4790, alıcı telefonu",
      reason: "Talep: Kısmi iade nasıl yapılır?",
      at: minutesAgo(29 * 60),
    },
  ];

  return {
    orders,
    customers: structuredClone(customers),
    specialDays,
    shopUsers: structuredClone(shopUsers).map((u) => ({ ...u, lastSeenAt: u.lastSeenAt && shiftIso(u.lastSeenAt) })),
    tickets,
    notifications,
    notes,
    audit,
    impersonations: new Map(),
    pilotApplications: [],
  };
}

/** Tahmin edilemez, URL'de güvenle taşınabilen anahtar. */
export function randomToken(length = 16): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
}

export const supportUserName = (id: string | null) => supportUsers.find((u) => u.id === id)?.name ?? null;

/** Denetim kaydına ekler; kayıt yalnızca eklenir, değiştirilmez. */
export function appendAudit(entry: Omit<AuditEntry, "id" | "at">) {
  const state = getStore();
  state.audit.unshift({ ...entry, id: `au_${state.audit.length + 1}_${randomToken(4)}`, at: new Date().toISOString() });
}

export function appendNotification(entry: Omit<NotificationLog, "id" | "at">) {
  const state = getStore();
  state.notifications.unshift({ ...entry, id: `nl_${randomToken(6)}`, at: new Date().toISOString() });
}
