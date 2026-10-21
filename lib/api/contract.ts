import type {
  AuditEntry,
  CannedReply,
  CardInput,
  CustomerDetail,
  CustomerSummary,
  Impersonation,
  ManualOrderInput,
  OrderStatus,
  PanelSession,
  PilotApplicationInput,
  Reminder,
  ShopOverview,
  ShopSummary,
  SupportOrderView,
  SupportSearchResult,
  SupportUser,
  TicketDetail,
  TicketInput,
  TicketSummary,
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

  // Satıcı paneli. Oturum backend'deki girişten gelir; destek ekibinin dükkân adına
  // açtığı süreli oturum varsa onunla birlikte döner.
  getPanelSession(impersonationId: string | null): Promise<PanelSession>;
  /** Teslim gününe göre; `from` ve `to` dahil. */
  getOrders(shopId: string, filter?: { from?: IsoDate; to?: IsoDate }): Promise<Order[]>;
  getOrder(shopId: string, orderId: string): Promise<Order | null>;
  /** Yalnızca izin verilen geçişler (lib/order-flow.ts); bildirimler backend'de gönderilir. */
  updateOrderStatus(shopId: string, orderId: string, status: OrderStatus): Promise<Result<Order, "status">>;
  markOrderPaid(shopId: string, orderId: string): Promise<Result<Order, "payment">>;
  getCustomers(shopId: string, filter?: { query?: string }): Promise<CustomerSummary[]>;
  getCustomer(shopId: string, customerId: string): Promise<CustomerDetail | null>;
  findCustomerByPhone(shopId: string, phone: string): Promise<(CustomerSummary & { lastOrder: Order | null }) | null>;
  /** Bugünden itibaren `days` gün içindeki özel günler. */
  getReminders(shopId: string, days: number): Promise<Reminder[]>;
  createManualOrder(shopId: string, input: ManualOrderInput): Promise<Result<{ orderId: string }, keyof ManualOrderInput>>;
  /** Panelden açılan destek talepleri ve durumları. */
  getShopTickets(shopId: string): Promise<TicketSummary[]>;
  createTicket(shopId: string, input: TicketInput): Promise<Result<{ ticketId: string }, keyof TicketInput>>;

  // Müşteri hizmetleri paneli. Kişisel veri maskeli gelir.
  getSupportUser(): Promise<SupportUser>;
  getSupportUsers(): Promise<SupportUser[]>;
  getTickets(): Promise<TicketSummary[]>;
  getTicket(ticketId: string): Promise<TicketDetail | null>;
  replyToTicket(
    ticketId: string,
    input: { text: string; internal: boolean; waitForShop: boolean },
  ): Promise<Result<true, "text">>;
  /** İptal ve iade gibi temsilcinin yetkisi olmayan işler için lidere aktarır. */
  escalateTicket(ticketId: string): Promise<boolean>;
  /** Gerekçe zorunludur ve denetim kaydına yazılır. */
  revealPhone(orderId: string, field: "recipient" | "sender", reason: string): Promise<string | null>;
  getShopSummaries(): Promise<ShopSummary[]>;
  getShopOverview(shopId: string): Promise<ShopOverview | null>;
  addShopNote(shopId: string, text: string): Promise<Result<true, "text">>;
  /** 30 dakikalık, gerekçeli ve kayıtlı oturum; dükkân sahibine bildirim gider. */
  startImpersonation(shopId: string, reason: string): Promise<Impersonation | null>;
  endImpersonation(impersonationId: string): Promise<void>;
  searchSupport(query: string): Promise<SupportSearchResult>;
  getAuditLog(): Promise<AuditEntry[]>;
  getCannedReplies(): Promise<CannedReply[]>;
  getSupportOrders(): Promise<(SupportOrderView & { shopName: string })[]>;

  // Tanıtım sitesi
  submitPilotApplication(input: PilotApplicationInput): Promise<Result<true, keyof PilotApplicationInput>>;
}
