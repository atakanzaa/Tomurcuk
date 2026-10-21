import type { TomurcukApi } from "@/lib/api/contract";
import { ShopLookupKind } from "@/lib/api/types";
import { mockCheckoutApi } from "./checkout";
import { mockPanelApi } from "./panel";
import { mockSupportApi } from "./support";
import { categories, deliveryZones, products, shops, timeSlots } from "./data";
import { getStore } from "./store";

// Çağıranın sabit veriyi değiştirememesi için her yanıt kopyalanır, tıpkı ağdan gelmiş gibi.
const copy = <T>(value: T): T => structuredClone(value);

export const mockApi: TomurcukApi = {
  async listFeaturedShopSlugs() {
    return shops.filter((shop) => shop.active && shop.featuredProductId).map((shop) => shop.slug);
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

  async getOrders(shopId, filter) {
    return copy(
      getStore()
        .orders.filter(
          (o) =>
            o.shopId === shopId &&
            (!filter?.from || o.deliveryDate >= filter.from) &&
            (!filter?.to || o.deliveryDate <= filter.to),
        )
        .sort((a, b) => a.deliveryDate.localeCompare(b.deliveryDate) || a.slotStart.localeCompare(b.slotStart)),
    );
  },

  ...mockCheckoutApi,
  ...mockPanelApi,
  ...mockSupportApi,
};
