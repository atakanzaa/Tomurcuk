import type {
  Category,
  DeliveryZone,
  IsoDate,
  Order,
  Product,
  ShopLookup,
  SlotAvailability,
  TimeSlot,
} from "./types";

/**
 * Frontend'in backend'den beklediği her şey. Şimdilik lib/mock uygular;
 * Spring Boot API hazır olunca aynı arayüzü HTTP ile uygulayan bir sürüm yazılır.
 * Dükkâna ait her çağrı shopId ile sınırlıdır.
 */
export interface TomurcukApi {
  /** Derlemede önceden render edilecek dükkânların slug'ları. */
  listFeaturedShopSlugs(): Promise<string[]>;
  findShop(slug: string): Promise<ShopLookup>;
  getCategories(shopId: string): Promise<Category[]>;
  /** Yalnızca aktif ürünler, `order` sırasıyla. */
  getProducts(shopId: string): Promise<Product[]>;
  getProduct(shopId: string, productId: string): Promise<Product | null>;
  /** Yalnızca aktif bölgeler. */
  getDeliveryZones(shopId: string): Promise<DeliveryZone[]>;
  getTimeSlots(shopId: string): Promise<TimeSlot[]>;
  getSlotAvailability(shopId: string, date: IsoDate): Promise<SlotAvailability[]>;
  getOrders(shopId: string, filter?: { date?: IsoDate }): Promise<Order[]>;
}
