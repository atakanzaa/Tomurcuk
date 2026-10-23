import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { connection } from "next/server";
import { SHELL_SLUG } from "@/lib/routes";
import type { TomurcukApi } from "./contract";
import { impl } from "./impl";
import { ShopLookupKind, type ShopLookup } from "./types";

// Vitrin verisi herkese açıktır ve her ziyaretçi için aynıdır; "use cache" ile önbelleğe
// alınır ve sayfanın statik kabuğuna girer.

export async function findShop(slug: string): Promise<ShopLookup> {
  "use cache";
  cacheLife("minutes");
  cacheTag(`shop-slug:${slug}`);
  // Derlemedeki kabuk API'ye gitmez; sayfa bunu bulunamayan dükkân gibi işler.
  if (slug === SHELL_SLUG) return { kind: ShopLookupKind.Missing };
  return impl.findShop(slug);
}

export async function getCategories(shopId: string) {
  "use cache";
  cacheLife("minutes");
  cacheTag(`shop:${shopId}`);
  return impl.getCategories(shopId);
}

export async function getProducts(shopId: string) {
  "use cache";
  cacheLife("minutes");
  cacheTag(`shop:${shopId}`, `products:${shopId}`);
  return impl.getProducts(shopId);
}

export async function getProduct(shopId: string, productId: string) {
  "use cache";
  cacheLife("minutes");
  cacheTag(`products:${shopId}`);
  return impl.getProduct(shopId, productId);
}

export async function getDeliveryZones(shopId: string) {
  "use cache";
  cacheLife("minutes");
  cacheTag(`shop:${shopId}`);
  return impl.getDeliveryZones(shopId);
}

export async function getTimeSlots(shopId: string) {
  "use cache";
  cacheLife("minutes");
  cacheTag(`shop:${shopId}`);
  return impl.getTimeSlots(shopId);
}

// Aşağıdakiler önbelleğe alınmaz: kapasite anlık değişir, siparişler, taslaklar ve
// panel verisi kişiye özeldir. Okuma fonksiyonları connection() ile istek anına
// bağlanır; bunları kullanan bileşenler <Suspense> içinde durur.

type Api = TomurcukApi;

/** İstek anında çalışan okuma. */
function read<K extends keyof Api>(name: K): Api[K] {
  const call = async (...args: unknown[]) => {
    await connection();
    return (impl[name] as (...a: unknown[]) => unknown)(...args);
  };
  return call as Api[K];
}

/** Yazma işlemleri yalnızca Server Action'lardan çağrılır. */
function write<K extends keyof Api>(name: K): Api[K] {
  return ((...args: unknown[]) => (impl[name] as (...a: unknown[]) => unknown)(...args)) as Api[K];
}

// Alıcı sipariş akışı
export const getDeliveryDays = read("getDeliveryDays");
export const getDraft = read("getDraft");
export const getOrderTracking = read("getOrderTracking");
export const createDraft = write("createDraft");
export const saveDelivery = write("saveDelivery");
export const saveCard = write("saveCard");
export const placeOrder = write("placeOrder");
export const findTrackingToken = write("findTrackingToken");
export const completePayment = write("completePayment");

// Satıcı paneli
export const getPanelSession = read("getPanelSession");
export const getOrders = read("getOrders");
export const getOrder = read("getOrder");
export const getCustomers = read("getCustomers");
export const getCustomer = read("getCustomer");
export const findCustomerByPhone = read("findCustomerByPhone");
export const getReminders = read("getReminders");
export const updateOrderStatus = write("updateOrderStatus");
export const markOrderPaid = write("markOrderPaid");
export const createManualOrder = write("createManualOrder");
export const getShopTickets = read("getShopTickets");
export const createTicket = write("createTicket");

// Müşteri hizmetleri paneli
export const getSupportUser = read("getSupportUser");
export const getSupportUsers = read("getSupportUsers");
export const getTickets = read("getTickets");
export const getTicket = read("getTicket");
export const getShopSummaries = read("getShopSummaries");
export const getShopOverview = read("getShopOverview");
export const searchSupport = read("searchSupport");
export const getAuditLog = read("getAuditLog");
export const getCannedReplies = read("getCannedReplies");
export const getSupportOrders = read("getSupportOrders");
export const replyToTicket = write("replyToTicket");
export const escalateTicket = write("escalateTicket");
export const revealPhone = write("revealPhone");
export const addShopNote = write("addShopNote");
export const startImpersonation = write("startImpersonation");
export const endImpersonation = write("endImpersonation");

// Tanıtım sitesi
export const submitPilotApplication = write("submitPilotApplication");

// Alıcı ana sayfası. Semt listesi ve seçki herkes için aynıdır, önbelleğe alınır; teslim
// durumu saate ve doluluğa bağlı olduğu için her istekte sorulur.
export async function getAreas() {
  "use cache";
  cacheLife("minutes");
  cacheTag("discover");
  return impl.getAreas();
}

export async function getShopPicks() {
  "use cache";
  cacheLife("minutes");
  cacheTag("discover");
  return impl.getShopPicks();
}

export const discoverShops = read("discoverShops");
export const findOrder = write("findOrder");
