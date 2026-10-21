import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { impl } from "./impl";

// Vitrin verisi herkese açıktır ve her ziyaretçi için aynıdır; "use cache" ile önbelleğe
// alınır ve sayfanın statik kabuğuna girer. Kapasite ve siparişler anlık ya da kişiye
// özel olduğu için önbelleğe alınmaz; bunları okuyan bileşenler <Suspense> içinde durur.

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

export function getSlotAvailability(shopId: string, date: string) {
  return impl.getSlotAvailability(shopId, date);
}

export function getOrders(shopId: string, filter?: { date?: string }) {
  return impl.getOrders(shopId, filter);
}
