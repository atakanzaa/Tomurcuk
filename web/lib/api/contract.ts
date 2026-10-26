import type {
  EmailCheckResult,
  Area,
  AuditEntry,
  OrderRef,
  ProductReviews,
  RecentReview,
  Review,
  ReviewField,
  ReviewInput,
  ReviewState,
  ShopRatings,
  ShopMatch,
  ShopStatusDetail,
  ShopPageInput,
  Bestseller,
  ShopStatusInput,
  ShopPick,
  CannedReply,
  CardInput,
  CustomerDetail,
  CustomerSummary,
  Impersonation,
  ManualOrderInput,
  NewOrders,
  SpecialDay,
  SpecialDayInput,
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
  OrderContract,
  PanelProduct,
  PanelSettings,
  PasswordHolder,
  PasswordLink,
  PilotApplication,
  OpenShopInput,
  Places,
  ShopProfileInput,
  SlotSetting,
  ZoneSetting,
  ProductInput,
  PlaceOrderInput,
  PlacedOrder,
  Product,
  Result,
  ShopLookup,
  TimeSlot,
} from "./types";

/**
 * Frontend'in backend'den beklediği her şey; api/ (Spring Boot) HTTP ile uygular (lib/api/http).
 * Dükkâna ait her çağrı dükkânla sınırlıdır: vitrin uçlarında shopId adreste, panel uçlarında
 * oturumdan gelir.
 */
export interface TomurcukApi {
  findShop(slug: string): Promise<ShopLookup>;
  getCategories(shopId: string): Promise<Category[]>;
  /** Yalnızca aktif ürünler, `order` sırasıyla. */
  getProducts(shopId: string): Promise<Product[]>;
  /** Son 90 günde en az 3 siparişte teslim edilen ürünlerin en çok gideni. */
  getBestseller(shopId: string): Promise<Bestseller>;
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
   * Kartla ödemede `paymentUrl` sağlayıcının ödeme sayfasıdır; alıcı oraya yönlenir ve
   * ödeme sonrası `completePayment` ile döner. Ödeme yarıda kalırsa aynı taslakla yeniden
   * çağrılınca aynı sipariş için yeni ödeme sayfası açılır.
   */
  placeOrder(
    shopId: string,
    draftId: string,
    input: PlaceOrderInput,
  ): Promise<Result<PlacedOrder, keyof PlaceOrderInput | "draft">>;
  /** Ödeme sayfasından dönüş. Sonucu backend sağlayıcıdan alır; bilinmeyen token null. */
  completePayment(shopId: string, token: string): Promise<{ trackingToken: string; paid: boolean } | null>;
  getOrderTracking(shopId: string, token: string): Promise<OrderTracking | null>;
  /** Takip linkinden: siparişin sözleşmelerdeki bilgileri. */
  getOrderContract(shopId: string, token: string): Promise<OrderContract | null>;
  /** Sipariş numarası ve gönderen telefonu eşleşirse takip token'ı. */
  findTrackingToken(shopId: string, input: { number: string; phone: string }): Promise<string | null>;

  // Satıcı paneli. Oturum backend'deki girişten gelir; destek ekibinin dükkân adına
  // açtığı süreli oturum varsa onunla birlikte döner.
  getPanelSession(impersonationId: string | null): Promise<PanelSession>;
  /** Teslim gününe göre; `from` ve `to` dahil. */
  getOrders(shopId: string, filter?: { from?: IsoDate; to?: IsoDate }): Promise<Order[]>;
  /** Bekleyen yeni siparişler (kartla ödemesi onaylanmamışlar hariç); panelin sesli uyarısı sorar. */
  getNewOrders(shopId: string): Promise<NewOrders>;
  getOrder(shopId: string, orderId: string): Promise<Order | null>;
  /** Yalnızca izin verilen geçişler (lib/order-flow.ts); bildirimler backend'de gönderilir. */
  updateOrderStatus(shopId: string, orderId: string, status: OrderStatus): Promise<Result<Order, "status">>;
  markOrderPaid(shopId: string, orderId: string): Promise<Result<Order, "payment">>;
  /** Yolda ya da teslim edilmiş siparişe teslim fotoğrafı; yenisi eskisinin yerine geçer. Bulunamayan sipariş null. */
  uploadDeliveryPhoto(shopId: string, orderId: string, file: Blob): Promise<Result<Order, "photo"> | null>;
  getCustomers(shopId: string, filter?: { query?: string }): Promise<CustomerSummary[]>;
  getCustomer(shopId: string, customerId: string): Promise<CustomerDetail | null>;
  /** `dayId` null ise yeni özel gün. Müşteri ya da özel gün bu dükkânın değilse null. */
  saveSpecialDay(
    shopId: string,
    customerId: string,
    dayId: string | null,
    input: SpecialDayInput,
  ): Promise<Result<SpecialDay, keyof SpecialDayInput | "day" | "form"> | null>;
  deleteSpecialDay(shopId: string, customerId: string, dayId: string): Promise<boolean>;
  findCustomerByPhone(shopId: string, phone: string): Promise<(CustomerSummary & { lastOrder: Order | null }) | null>;
  /** Bugünden itibaren `days` gün içindeki özel günler. */
  getReminders(shopId: string, days: number): Promise<Reminder[]>;
  createManualOrder(shopId: string, input: ManualOrderInput): Promise<Result<{ orderId: string }, keyof ManualOrderInput>>;
  /** Satışta olmayanlar dahil, silinenler hariç; dükkânın sırasıyla. */
  getPanelProducts(shopId: string): Promise<PanelProduct[]>;
  getPanelProduct(shopId: string, productId: string): Promise<PanelProduct | null>;
  /** `productId` null ise yeni ürün. Yalnızca dükkân sahibi (CATALOG_EDIT); bulunamayan ürün null. */
  saveProduct(
    shopId: string,
    productId: string | null,
    input: ProductInput,
  ): Promise<Result<{ productId: string }, keyof ProductInput | "category"> | null>;
  deleteProduct(shopId: string, productId: string): Promise<boolean>;
  /** Fotoğrafı 4:5 kırpıp depoya yazar; adres ürün kaydedilirken `photos`'a girer. */
  uploadProductPhoto(shopId: string, file: Blob): Promise<Result<{ url: string }, "photo">>;
  getPanelSettings(shopId: string): Promise<PanelSettings>;
  /** Ayarları yalnızca dükkân sahibi değiştirir (CATALOG_EDIT). */
  saveShopProfile(shopId: string, input: ShopProfileInput): Promise<Result<true, keyof ShopProfileInput>>;
  saveShopPage(shopId: string, input: ShopPageInput): Promise<Result<true, keyof ShopPageInput>>;
  /** Kapak 3:2, logo ve atölye fotoğrafı kare kırpılır; adres sayfa kaydedilirken listeye girer. */
  uploadShopPhoto(shopId: string, kind: "cover" | "square", file: Blob): Promise<Result<{ url: string }, "photo">>;
  saveSameDayCutoff(shopId: string, cutoff: string): Promise<Result<true, "sameDayCutoff">>;
  /** Liste olduğu gibi yazılır; gelmeyen aralık ve bölge pasife alınır. */
  saveTimeSlots(shopId: string, slots: SlotSetting[]): Promise<Result<true, "slots">>;
  saveDeliveryZones(shopId: string, zones: ZoneSetting[]): Promise<Result<true, "zones">>;
  addClosedDay(shopId: string, date: string): Promise<Result<{ date: IsoDate; reserved: number }, "date">>;
  removeClosedDay(shopId: string, date: IsoDate): Promise<boolean>;
  /** Teslim bölgeleri bu listeden seçilir. */
  getIstanbulPlaces(): Promise<Places>;
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

  getPilotApplications(): Promise<PilotApplication[]>;
  /** Dükkân, sahibinin hesabı ve şifre bağlantısı tek işlemde; platform sahibi ve lider. */
  openShop(input: OpenShopInput): Promise<Result<PasswordLink, keyof OpenShopInput>>;
  /** Sahibe yeni şifre bağlantısı; eskisi geçersiz olur. Sahibi olmayan dükkânda null. */
  createPasswordLink(shopId: string): Promise<PasswordLink | null>;
  /** Geçici kapatma `SHOP_PAUSE`, askıya alma ve kalıcı kapatma `SHOP_SUSPEND` ister. Bulunamayan dükkân null. */
  changeShopStatus(
    shopId: string,
    input: ShopStatusInput,
  ): Promise<Result<ShopStatusDetail, "status" | "reason" | "pausedUntil" | "form"> | null>;
  /** Deneme e-postası; `to` boşsa giriş yapan destek kullanıcısına. Sağlayıcının yanıtı hemen döner. */
  sendTestEmail(to: string | null): Promise<Result<EmailCheckResult, "to">>;

  // Şifre belirleme bağlantısı (/sifre/<token>); oturumsuz.
  getPasswordHolder(token: string): Promise<PasswordHolder | null>;
  setPassword(token: string, password: string): Promise<Result<true, "token" | "password">>;
  /** Şifremi unuttum: adres kayıtlı olsun olmasın aynı yanıt; bağlantı yalnızca e-postayla gider. */
  requestPasswordReset(email: string): Promise<void>;

  // Tanıtım sitesi
  submitPilotApplication(input: PilotApplicationInput): Promise<Result<true, keyof PilotApplicationInput>>;

  // Alıcı ana sayfası: semt ve güne göre dükkânlar. Sipariş dükkânın kendi sayfasında verilir.
  getAreas(): Promise<Area[]>;
  /** Sıra backend'de: o gün teslim edebilenler önce, ilk müsait aralığa göre. */
  discoverShops(input: { district: string; neighborhood: string | null; date: IsoDate }): Promise<ShopMatch[]>;
  getShopPicks(): Promise<ShopPick[]>;
  /** Sipariş numarası ve gönderen telefonu bütün dükkânlarda eşleşirse takip adresi. */
  findOrder(input: { number: string; phone: string }): Promise<OrderRef | null>;

  // Yorumlar. Yalnızca teslim edilen siparişin göndereni takip linkinden, teslimden sonraki 30
  // gün içinde yazar; her siparişe bir yorum.
  /** Başka dükkânın takip kodu null. */
  getReviewState(shopId: string, token: string): Promise<ReviewState | null>;
  writeReview(shopId: string, token: string, input: ReviewInput): Promise<Result<Review, ReviewField> | null>;
  getShopRatings(shopId: string): Promise<ShopRatings>;
  getProductReviews(shopId: string, productId: string): Promise<ProductReviews>;
  /** Farklı dükkânlardan en yeni 6 yorum. */
  getRecentReviews(): Promise<RecentReview[]>;
  /** Panel: dükkânın yorumları, gizlenenler dahil. */
  getPanelReviews(): Promise<Review[]>;
  /** Destek ekibinin bütün rolleri; gerekçe zorunlu, denetim kaydına yazılır. Zaten gizliyse null. */
  hideReview(reviewId: string, reason: string): Promise<Result<Review, "reason"> | null>;
}
