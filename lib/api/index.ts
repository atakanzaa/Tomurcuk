import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { connection } from "next/server";
import type { TomurcukApi } from "./contract";
import { impl } from "./impl";

// Vitrin verisi herkese açıktır ve her ziyaretçi için aynıdır; "use cache" ile önbelleğe
// alınır ve sayfanın statik kabuğuna girer.

export async function listFeaturedShopSlugs() {
  "use cache";
  cacheLife("hours");
  return impl.listFeaturedShopSlugs();
}

export async function findShop(slug: string) {
  "use cache";
  cacheLife("minutes");
  cacheTag(`shop-slug:${slug}`);
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

// Aşağıdakiler önbelleğe alınmaz: kapasite anlık değişir, siparişler ve taslaklar
// kişiye özeldir. Okuma fonksiyonları connection() ile istek anına bağlanır; bunları
// kullanan bileşenler <Suspense> içinde durur.

export async function getDeliveryDays(shopId: string, days: number) {
  await connection();
  return impl.getDeliveryDays(shopId, days);
}

export async function getOrders(shopId: string, filter?: { date?: string }) {
  await connection();
  return impl.getOrders(shopId, filter);
}

export async function getDraft(shopId: string, draftId: string) {
  await connection();
  return impl.getDraft(shopId, draftId);
}

export async function getOrderTracking(shopId: string, token: string) {
  await connection();
  return impl.getOrderTracking(shopId, token);
}

// Yazma işlemleri yalnızca Server Action'lardan çağrılır.
export const createDraft: TomurcukApi["createDraft"] = (...args) => impl.createDraft(...args);
export const saveDelivery: TomurcukApi["saveDelivery"] = (...args) => impl.saveDelivery(...args);
export const saveCard: TomurcukApi["saveCard"] = (...args) => impl.saveCard(...args);
export const placeOrder: TomurcukApi["placeOrder"] = (...args) => impl.placeOrder(...args);
export const findTrackingToken: TomurcukApi["findTrackingToken"] = (...args) => impl.findTrackingToken(...args);
