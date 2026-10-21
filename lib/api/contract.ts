import type {
  CardInput,
  Category,
  DeliveryDay,
  DeliveryInput,
  DeliveryZone,
  IsoDate,
  Order,
  OrderDraft,
  OrderTracking,
  PlaceOrderInput,
  Product,
  Result,
  ShopLookup,
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
  /** Bugünden (dükkânın saat dilimine göre) başlayarak `days` günün takvimi ve kapasitesi. */
  getDeliveryDays(shopId: string, days: number): Promise<DeliveryDay[]>;
  getOrders(shopId: string, filter?: { date?: IsoDate }): Promise<Order[]>;

  // Alıcı sipariş akışı. Her adım backend'de, backend'in saatiyle doğrulanır;
  // "bugün" ve son sipariş saati hiçbir zaman çağırandan alınmaz.
  createDraft(
    shopId: string,
    input: { productId: string; optionIds: string[] },
  ): Promise<Result<OrderDraft, "product" | "size" | "options">>;
  getDraft(shopId: string, draftId: string): Promise<OrderDraft | null>;
  /** Doğrularsa seçilen aralığı 10 dakikalığına ayırır. */
  saveDelivery(
    shopId: string,
    draftId: string,
    input: DeliveryInput,
  ): Promise<Result<OrderDraft, keyof DeliveryInput>>;
  saveCard(shopId: string, draftId: string, input: CardInput): Promise<Result<OrderDraft, keyof CardInput>>;
  /**
   * Ürünü, fiyatı, son saati ve aralık rezervasyonunu yeniden doğrular, siparişi oluşturur.
   * Kartla ödemede gerçek uygulama sağlayıcının sayfasına yönlendirir; mock ödemeyi başarılı sayar.
   */
  placeOrder(
    shopId: string,
    draftId: string,
    input: PlaceOrderInput,
  ): Promise<Result<{ trackingToken: string }, keyof PlaceOrderInput | "draft">>;
  getOrderTracking(shopId: string, token: string): Promise<OrderTracking | null>;
  /** Sipariş numarası ve gönderen telefonu eşleşirse takip token'ı. */
  findTrackingToken(shopId: string, input: { number: string; phone: string }): Promise<string | null>;
}
