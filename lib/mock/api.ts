import type { TomurcukApi } from "@/lib/api/contract";
import { ShopLookupKind } from "@/lib/api/types";
import { categories, deliveryZones, orders, products, remainingBySlot, shops, timeSlots } from "./data";

// Çağıranın sabit veriyi değiştirememesi için her yanıt kopyalanır, tıpkı ağdan gelmiş gibi.
const copy = <T>(value: T): T => structuredClone(value);

export const mockApi: TomurcukApi = {
  async listFeaturedShopSlugs() {
    return shops.filter((shop) => shop.active).map((shop) => shop.slug);
  },

  async findShop(slug) {
    const shop = shops.find((s) => s.slug === slug);
    if (shop) return { kind: ShopLookupKind.Found, shop: copy(shop) };
    const moved = shops.find((s) => s.previousSlugs.includes(slug));
    if (moved) return { kind: ShopLookupKind.Moved, slug: moved.slug };
    return { kind: ShopLookupKind.Missing };
  },

  async getCategories(shopId) {
    return copy(categories.filter((c) => c.shopId === shopId).sort((a, b) => a.order - b.order));
  },

  async getProducts(shopId) {
    return copy(products.filter((p) => p.shopId === shopId && p.active).sort((a, b) => a.order - b.order));
  },

  async getProduct(shopId, productId) {
    const product = products.find((p) => p.shopId === shopId && p.id === productId && p.active);
    return product ? copy(product) : null;
  },

  async getDeliveryZones(shopId) {
    return copy(deliveryZones.filter((z) => z.shopId === shopId && z.active));
  },

  async getTimeSlots(shopId) {
    return copy(timeSlots.filter((s) => s.shopId === shopId));
  },

  async getSlotAvailability(shopId, date) {
    return timeSlots
      .filter((s) => s.shopId === shopId)
      .map((s) => ({ slotId: s.id, date, remaining: remainingBySlot[s.id] ?? s.capacity }));
  },

  async getOrders(shopId, filter) {
    return copy(
      orders.filter((o) => o.shopId === shopId && (!filter?.date || o.deliveryDate === filter.date)),
    );
  },
};
