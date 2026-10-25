// Alan adları docs/mvp.md "Veri modeli" tablolarından gelir; kodda İngilizce yazılır.
// Para alanları kuruş cinsinden tamsayıdır (125000 = 1.250 TL).
// Tarihler "YYYY-MM-DD", saatler "HH:mm" biçiminde ve dükkânın saat diliminde tutulur.
//
// Sabit değer kümeleri TS `enum` yerine `as const` nesne + aynı adlı birleşim tipiyle
// tanımlanır: derlemede iz bırakmaz (isolatedModules / erasableSyntaxOnly uyumlu),
// çalışma anında üzerinde gezilebilir ve API'den gelen JSON string'leriyle birebir eşleşir.
// Bu dosya sunucuya özel değildir; istemci bileşenleri de import edebilir.

export type Kurus = number;
export type IsoDate = string;
export type ClockTime = string;

type ValueOf<T> = T[keyof T];

export const ShopPlan = {
  Pilot: "pilot",
  Starter: "starter",
  Pro: "pro",
} as const;
export type ShopPlan = ValueOf<typeof ShopPlan>;

export const OptionKind = {
  /** Boy: küçük, orta, büyük. Ürün başına biri seçilir. */
  Size: "size",
  /** Vazo eklemesi; "Vazolu" filtresi buna bakar. */
  Vase: "vase",
  /** Çikolata gibi diğer eklemeler. */
  Addon: "addon",
} as const;
export type OptionKind = ValueOf<typeof OptionKind>;

export const OrderSource = {
  Link: "link",
  Phone: "phone",
  WhatsApp: "whatsapp",
  Instagram: "instagram",
  /** Dükkâna gelip verilen sipariş. Veri modeline ek. */
  Store: "store",
  CicekSepeti: "ciceksepeti",
} as const;
export type OrderSource = ValueOf<typeof OrderSource>;

export const OrderStatus = {
  New: "new",
  Preparing: "preparing",
  OnWay: "onway",
  Delivered: "delivered",
  /** Teslim edilemedi: alıcı adreste yok vb. */
  Failed: "failed",
  Cancelled: "cancelled",
} as const;
export type OrderStatus = ValueOf<typeof OrderStatus>;

export const PaymentStatus = {
  Pending: "pending",
  Paid: "paid",
  Unpaid: "unpaid",
} as const;
export type PaymentStatus = ValueOf<typeof PaymentStatus>;

export const PaymentMethod = {
  Card: "card",
  Transfer: "transfer",
  Cash: "cash",
} as const;
export type PaymentMethod = ValueOf<typeof PaymentMethod>;

/** shop. Veri modeline ek: shortName, previousSlugs, timeZone, description*, openingHours, featuredProductId. */
export const ShopStatus = {
  Open: "open",
  /** Siparişe geçici kapalı; vitrin açık. */
  Paused: "paused",
  /** Askıda; vitrinde yalnızca adı, panel açık. */
  Suspended: "suspended",
  /** Kalıcı kapalı; vitrin 404, panel girişi yok. */
  Closed: "closed",
} as const;
export type ShopStatus = ValueOf<typeof ShopStatus>;

/** Durumun ayrıntısı; gerekçe yalnızca panelde ve destekte görünür. */
export interface ShopStatusDetail {
  status: ShopStatus;
  reason: string;
  pausedUntil: string | null;
  changedAt: string | null;
  changedBy: string | null;
}

export interface ShopStatusInput {
  status: ShopStatus;
  reason: string;
  /** ISO an; yalnızca geçici kapatmada, en çok 30 gün sonrası. */
  pausedUntil: string | null;
  /** Kalıcı kapatmada açık siparişler görüldü. */
  confirmOpenOrders: boolean;
}

export interface Shop {
  id: string;
  name: string;
  /** Başlıkta kullanılan kısa ad, ör. "Nergis". */
  shortName: string;
  slug: string;
  /** Eski adresler; bunlarla gelen istek kalıcı olarak `slug`'a yönlendirilir. */
  previousSlugs: string[];
  phone: string;
  address: string;
  logoUrl: string | null;
  /** Sipariş alıyor mu: `status` açıksa true. */
  active: boolean;
  /** Destek ekibinin belirlediği durum; kalıcı kapalı dükkânın vitrini bulunmaz. */
  status: ShopStatus;
  /** Geçici kapatmanın bitişi; geçince dükkân kendiliğinden açılır. */
  pausedUntil: string | null;
  plan: ShopPlan;
  /** Aynı gün teslim için son sipariş saati. */
  sameDayCutoff: ClockTime;
  timeZone: string;
  /** Vitrin girişindeki tanıtım metni (masaüstü). */
  description: string;
  /** Mobilde gösterilen kısa tanıtım metni. */
  descriptionShort: string;
  openingHours: string;
  /** Dükkânın favorisi; vitrinde çiçekçinin notuyla öne çıkar. */
  featuredProductId: string | null;
  /** Favorinin yanındaki not; kart notu etiketinde. */
  favoriteNote: string;
  /** 3:2 kapak fotoğrafı; yoksa vitrin kapaksız açılır. */
  coverPhotoUrl: string | null;
  story: string;
  foundedYear: number | null;
  /** En çok üç kare atölye fotoğrafı. */
  storyPhotos: string[];
  /** Sözleşmelerde satıcı: unvan ya da ad soyad. Boşsa dükkân ayarlarından doldurulmamıştır. */
  legalName: string;
  taxOffice: string;
  taxNumber: string;
  email: string;
}

/** Vitrindeki kategori menüsü. Veri modeline ek. */
export interface Category {
  id: string;
  shopId: string;
  slug: string;
  name: string;
  order: number;
}

/** product_option. `kind` ve `detail` veri modeline ek. */
export interface ProductOption {
  id: string;
  productId: string;
  name: string;
  /** Boy seçeneklerinde dal sayısı gibi ek açıklama, ör. "25 dal". */
  detail: string | null;
  kind: OptionKind;
  extraPrice: Kurus;
}

/** product. Veri modeline ek: categoryId, summary, options. */
export interface Product {
  id: string;
  shopId: string;
  categoryId: string;
  name: string;
  description: string;
  /** Listede fiyatın yanındaki kısa bilgi, ör. "12 dal", "Aynı gün". */
  summary: string;
  price: Kurus;
  /** Kapak fotoğrafı; `photos`'un ilki. */
  photoUrl: string | null;
  /** Sırayla en çok dört fotoğraf. */
  photos: string[];
  active: boolean;
  order: number;
  options: ProductOption[];
}

/** Tanıtım sitesinden gelen pilot başvurusu; `shopId` doluysa dükkân açılmıştır. */
export interface PilotApplication {
  id: string;
  shopName: string;
  phone: string;
  district: string;
  instagram: string | null;
  createdAt: string;
  shopId: string | null;
}

/** Destek panelinden dükkân açma; `applicationId` başvurudan açılıyorsa. */
export interface OpenShopInput {
  applicationId: string;
  name: string;
  shortName: string;
  slug: string;
  phone: string;
  address: string;
  ownerName: string;
  ownerEmail: string;
}

/** Sahibin şifre belirleme bağlantısı; yalnızca oluşturulduğu yanıtta görünür, 7 gün geçerli. */
export interface PasswordLink {
  shopId: string;
  slug: string;
  ownerName: string;
  ownerEmail: string;
  url: string;
}

/** Şifre belirleme sayfasında bağlantının sahibi. */
export interface PasswordHolder {
  name: string;
  email: string;
  shopName: string;
}

/** Panelde dükkân ve teslimat ayarları. Saat aralığı ve bölge satırında `id` yeni satırda null. */
/** Bekleyen yeni siparişler; `latestOrderId` değişince panel sesli uyarı verir. */
export interface NewOrders {
  count: number;
  latestOrderId: string | null;
  latestNumber: string | null;
}

export interface PanelSettings {
  profile: { shop: Shop; notifyPhone: string | null; notifySms: boolean };
  slots: SlotSetting[];
  zones: ZoneSetting[];
  /** Bugünden sonraki kapalı günler; `reserved` o güne alınmış sipariş ve ayrılmış yer sayısı. */
  closedDays: { date: IsoDate; reserved: number }[];
}

export interface SlotSetting {
  id: string | null;
  start: ClockTime;
  end: ClockTime;
  capacity: number | null;
}

/** Mahalle null ise bütün ilçe. */
export interface ZoneSetting {
  id: string | null;
  district: string;
  neighborhood: string | null;
  fee: Kurus | null;
}

export interface ShopProfileInput {
  name: string;
  shortName: string;
  phone: string;
  address: string;
  descriptionShort: string;
  description: string;
  openingHours: string;
  legalName: string;
  taxOffice: string;
  taxNumber: string;
  email: string;
  notifyPhone: string;
  notifySms: boolean;
}

/** Dükkânın sayfası; fotoğraflar panelden yüklenen adreslerdir. */
export interface ShopPageInput {
  logoUrl: string | null;
  coverPhotoUrl: string | null;
  story: string;
  foundedYear: number | null;
  storyPhotos: string[];
  featuredProductId: string | null;
  favoriteNote: string;
}

/** Son 90 günde en az 3 siparişte teslim edilen ürünlerin en çok gideni; yoksa `productId` boş. */
export interface Bestseller {
  productId: string | null;
  orders: number;
}

/** İlçe → mahalleler (İstanbul). */
export type Places = Record<string, string[]>;

/** Panelde ürün: satışta olmayanlar da gelir; son değişikliğin zamanı ve yapanın adı. */
export interface PanelProduct {
  product: Product;
  updatedAt: string | null;
  updatedBy: string | null;
}

/** Boy ya da ek seçenek. Boyda `price` tam fiyattır ("Küçük, 10 dal" 850 TL), ek seçenekte ek ücrettir. */
export interface ProductChoice {
  /** Var olan seçeneğin kimliği; yeni satırda null. */
  id: string | null;
  name: string;
  price: Kurus | null;
}

/**
 * Panelden ürün kaydı. `categoryId` boşsa `newCategory` adıyla kategori açılır. Boy yoksa ürünün
 * tek fiyatı `price`'tır. `photos` yüklenmiş fotoğrafların adresleri, ilki kapak.
 */
export interface ProductInput {
  categoryId: string;
  newCategory: string;
  name: string;
  summary: string;
  description: string;
  price: Kurus | null;
  sizes: ProductChoice[];
  extras: ProductChoice[];
  photos: string[];
  active: boolean;
}

/** delivery_zone */
export interface DeliveryZone {
  id: string;
  shopId: string;
  district: string;
  neighborhood: string | null;
  fee: Kurus;
  active: boolean;
}

/** time_slot (haftalık şablon) */
export interface TimeSlot {
  id: string;
  shopId: string;
  start: ClockTime;
  end: ClockTime;
  capacity: number;
}

/** customer. `marketingConsent` İYS izni; yoksa hatırlatma mesajı gönderilmez. */
export interface Customer {
  id: string;
  shopId: string;
  name: string;
  phone: string;
  email: string | null;
  note: string | null;
  marketingConsent: boolean;
}

/** order_item; ürün adı, fiyat ve seçenekler sipariş anında kopyalanır. */
export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  unitPrice: Kurus;
  quantity: number;
  options: Pick<ProductOption, "name" | "kind" | "extraPrice">[];
}

/** order. Bölge adı ve saat aralığı sipariş anında kopyalanır (zoneName, slotStart, slotEnd). */
export interface Order {
  id: string;
  /** Dışa açık sipariş numarası, ör. "T-4821". */
  number: string;
  shopId: string;
  customerId: string;
  source: OrderSource;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  deliveryDate: IsoDate;
  timeSlotId: string | null;
  slotStart: ClockTime;
  slotEnd: ClockTime;
  /** Planlanan ya da alıcının istediği kesin teslim saati. */
  deliveryTime: ClockTime | null;
  exactTime: boolean;
  deliveryZoneId: string;
  zoneName: string;
  recipientName: string;
  recipientPhone: string;
  address: string;
  courierNote: string | null;
  cardNote: string | null;
  senderName: string | null;
  anonymous: boolean;
  items: OrderItem[];
  subtotal: Kurus;
  deliveryFee: Kurus;
  total: Kurus;
  deliveryPhotoUrl: string | null;
  createdAt: string;
  /** Takip linkindeki tahmin edilemez anahtar; sipariş numarası URL'de kullanılmaz. */
  trackingToken: string;
  /** Bildirimlerin gittiği gönderen telefonu. */
  senderPhone: string;
  courierName: string | null;
  /** order_event: durum geçmişi, eskiden yeniye. */
  events: { status: OrderStatus; at: string }[];
}

export const ShopLookupKind = {
  Found: "found",
  /** Eski slug; kalıcı yönlendirme gerekir. */
  Moved: "moved",
  Missing: "missing",
} as const;
export type ShopLookupKind = ValueOf<typeof ShopLookupKind>;

export type ShopLookup =
  | { kind: typeof ShopLookupKind.Found; shop: Shop }
  | { kind: typeof ShopLookupKind.Moved; slug: string }
  | { kind: typeof ShopLookupKind.Missing };

// ---------------------------------------------------------------------------
// Alıcı sipariş akışı. Taslak backend'de tutulur; tarayıcı yalnızca kimliğini bilir.
// Hata metinleri arayüzün işidir: API kod döner, arayüz Türkçe mesaja çevirir.

/** Teslimat takvimindeki bir gün. Kapalı günde aralıklar gösterilmez. */
export interface DeliveryDay {
  date: IsoDate;
  closed: boolean;
  /** Aynı gün son saati geçtiyse true; o günün aralıkları kapanmıştır. */
  sameDayClosed: boolean;
  /** Bugün için başlama saati geçmiş aralıklar listede yoktur. */
  slots: { slotId: string; remaining: number }[];
}

/** Taslaktaki ürün satırı; fiyat ve ad seçildiği andaki değerdir. */
export interface DraftItem {
  productId: string;
  productName: string;
  unitPrice: Kurus;
  options: Pick<ProductOption, "id" | "name" | "detail" | "kind" | "extraPrice">[];
  lineTotal: Kurus;
}

export interface DraftDelivery {
  date: IsoDate;
  slotId: string;
  slotStart: ClockTime;
  slotEnd: ClockTime;
  zoneId: string;
  district: string;
  neighborhood: string;
  fee: Kurus;
  recipientName: string;
  recipientPhone: string;
  address: string;
  courierNote: string;
  /** Saat aralığı bu ana kadar alıcı için ayrılmıştır. */
  reservedUntil: string;
}

export interface DraftCard {
  message: string;
  signature: string;
  anonymous: boolean;
  senderPhone: string;
}

export interface OrderDraft {
  id: string;
  shopId: string;
  item: DraftItem;
  delivery: DraftDelivery | null;
  card: DraftCard | null;
  subtotal: Kurus;
  deliveryFee: Kurus;
  total: Kurus;
}

export interface DeliveryInput {
  date: string;
  slotId: string;
  recipientName: string;
  recipientPhone: string;
  zoneId: string;
  neighborhood: string;
  address: string;
  courierNote: string;
}

export type CardInput = DraftCard;

export interface PlaceOrderInput {
  paymentMethod: string;
  consent: boolean;
  /** Formla birlikte üretilen tek kullanımlık anahtar; ikinci gönderim aynı siparişi döner. */
  idempotencyKey: string;
}

export interface PlacedOrder {
  trackingToken: string;
  /** Kartla ödemede sağlayıcının ödeme sayfası; havalede null. */
  paymentUrl: string | null;
}

export const CheckoutError = {
  Required: "required",
  TooLong: "too_long",
  PhoneInvalid: "phone_invalid",
  ProductUnavailable: "product_unavailable",
  OptionInvalid: "option_invalid",
  SizeRequired: "size_required",
  DayClosed: "day_closed",
  SameDayClosed: "same_day_closed",
  DateOutOfRange: "date_out_of_range",
  SlotFull: "slot_full",
  ZoneInvalid: "zone_invalid",
  ConsentRequired: "consent_required",
  PaymentMethodInvalid: "payment_method_invalid",
  PriceChanged: "price_changed",
  ReservationExpired: "reservation_expired",
  /** Ödeme sağlayıcısının sayfası açılamadı; sipariş açık kalır. */
  PaymentUnavailable: "payment_unavailable",
  DraftIncomplete: "draft_incomplete",
  // Panel: ürün formu.
  PriceInvalid: "price_invalid",
  PhotoInvalid: "photo_invalid",
  // Dükkân durumu.
  ShopUnavailable: "shop_unavailable",
  ShopClosed: "shop_closed",
  OpenOrders: "open_orders",
  /** Teslim fotoğrafı sipariş yola çıkmadan eklenmez. */
  DeliveryPhotoStatus: "delivery_photo_status",
  TooMany: "too_many",
  // Yorumlar.
  NotDelivered: "not_delivered",
  ReviewClosed: "review_closed",
  AlreadyReviewed: "already_reviewed",
  // Panel: ayarlar.
  SlotOverlap: "slot_overlap",
  ZoneDuplicate: "zone_duplicate",
  TaxNumberInvalid: "tax_number_invalid",
  EmailInvalid: "email_invalid",
  // Destek: dükkân açma, şifre belirleme.
  SlugInvalid: "slug_invalid",
  SlugTaken: "slug_taken",
  EmailTaken: "email_taken",
  PasswordShort: "password_short",
  LinkInvalid: "link_invalid",
} as const;
export type CheckoutError = ValueOf<typeof CheckoutError>;

/** Alan adı → hata kodu. Bazı kodlar mesaj için ek bilgi taşır (ör. dolu aralığın alternatifi). */
export type FieldErrors<F extends string = string> = Partial<
  Record<F, { code: CheckoutError; meta?: Record<string, string | number> }>
>;

export type Result<T, F extends string = string> = { ok: true; value: T } | { ok: false; errors: FieldErrors<F> };

/**
 * Takip linkinden açılan sözleşmelerde siparişe ait kısım. `termsVersion` alıcının onayladığı
 * metnin sürümü (lib/legal/version.ts); panelden girilen siparişte null.
 */
export interface OrderContract {
  number: string;
  createdAt: string;
  termsVersion: string | null;
  paymentMethod: PaymentMethod;
  items: OrderItem[];
  subtotal: Kurus;
  deliveryFee: Kurus;
  total: Kurus;
  deliveryDate: IsoDate;
  slotStart: ClockTime;
  slotEnd: ClockTime;
  recipientName: string;
  zoneName: string;
  address: string;
}

/** Alıcıya gösterilen takip görünümü. İsimsiz gönderimde imza hiç gelmez. */
export interface OrderTracking {
  token: string;
  number: string;
  shopId: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  deliveryDate: IsoDate;
  slotStart: ClockTime;
  slotEnd: ClockTime;
  /** Yoldayken tahmini varış, teslimde gerçek saat. */
  deliveryTime: ClockTime | null;
  recipientName: string;
  cardNote: string | null;
  signature: string | null;
  anonymous: boolean;
  courierName: string | null;
  deliveryPhotoUrl: string | null;
  /** Bildirimlerin gittiği gönderen telefonu. */
  senderPhone: string;
  /** Durum değişiklikleri, eskiden yeniye. `at` ISO zaman damgası (UTC). */
  events: { status: OrderStatus; at: string }[];
}

// ---------------------------------------------------------------------------
// Satıcı paneli

export const ShopRole = { Owner: "owner", Staff: "staff" } as const;
export type ShopRole = ValueOf<typeof ShopRole>;

/** shop_user */
export interface ShopUser {
  id: string;
  shopId: string;
  name: string;
  email: string;
  role: ShopRole;
  lastSeenAt: string | null;
}

/** Destek ekibinin dükkân adına açtığı süreli oturum (impersonation_session). */
export interface Impersonation {
  id: string;
  supportUserName: string;
  shopId: string;
  reason: string;
  startedAt: string;
  endsAt: string;
}

export interface PanelSession {
  shop: Shop;
  user: ShopUser;
  impersonation: Impersonation | null;
  /** Dükkân siparişe kapalı ya da askıdaysa destek ekibinin gerekçesi. */
  statusReason: string;
}

/** special_day; yıl tutulmaz, her yıl tekrar eder. */
export interface SpecialDay {
  id: string;
  customerId: string;
  title: string;
  day: number;
  month: number;
  recipientName: string | null;
}

/** Ay 1–12; gün o ayda olmalı (29 Şubat geçerli). */
export interface SpecialDayInput {
  title: string;
  day: number;
  month: number;
  recipientName: string;
}

export interface CustomerSummary extends Customer {
  orderCount: number;
  totalSpent: Kurus;
  lastOrderAt: string | null;
}

export interface CustomerDetail {
  customer: CustomerSummary;
  orders: Order[];
  specialDays: SpecialDay[];
}

/** Önümüzdeki günlerdeki bir özel gün ve geçen yılki siparişi. */
export interface Reminder {
  specialDay: SpecialDay;
  customer: CustomerSummary;
  /** Bu yılki tarih; 29 Şubat artık yıl olmayan yılda 28 Şubat'tır. */
  date: IsoDate;
  lastYear: { productName: string; total: Kurus } | null;
}

export interface ManualOrderInput {
  source: string;
  customerPhone: string;
  customerName: string;
  items: { productId: string; optionId: string | null; quantity: number }[];
  date: string;
  slotId: string;
  exactTime: string;
  recipientName: string;
  recipientPhone: string;
  address: string;
  cardNote: string;
  payment: string;
}

// ---------------------------------------------------------------------------
// Müşteri hizmetleri paneli

export const SupportRole = { Owner: "owner", Lead: "lead", Agent: "agent" } as const;
export type SupportRole = ValueOf<typeof SupportRole>;

/** platform_user */
export interface SupportUser {
  id: string;
  name: string;
  role: SupportRole;
}

export const TicketCategory = {
  Payment: "payment",
  Delivery: "delivery",
  Technical: "technical",
  Account: "account",
} as const;
export type TicketCategory = ValueOf<typeof TicketCategory>;

export const TicketPriority = { Urgent: "urgent", Normal: "normal" } as const;
export type TicketPriority = ValueOf<typeof TicketPriority>;

export const TicketStatus = { Open: "open", WaitingShop: "waiting_shop", Resolved: "resolved" } as const;
export type TicketStatus = ValueOf<typeof TicketStatus>;

/** support_ticket, listede gereken alanlarla. */
export interface TicketSummary {
  id: string;
  subject: string;
  shopId: string;
  shopName: string;
  shopDistrict: string;
  orderId: string | null;
  orderNumber: string | null;
  orderDate: IsoDate | null;
  orderSlot: { start: ClockTime; end: ClockTime } | null;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  assigneeId: string | null;
  assigneeName: string | null;
  createdAt: string;
  /** Son durum değişikliğinden beri bekleme; çözülende kapanış zamanı. */
  waitingSince: string;
  firstResponseAt: string | null;
}

/** ticket_message; dahili notlar dükkâna görünmez. */
export interface TicketMessage {
  id: string;
  authorName: string;
  authorOrg: string;
  internal: boolean;
  text: string;
  at: string;
}

export interface TimelineEvent {
  at: string;
  text: string;
  actor: string;
  failed: boolean;
}

/** Destek ekibinin gördüğü sipariş: kişisel veri maskeli. */
export interface SupportOrderView {
  id: string;
  number: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  deliveryDate: IsoDate;
  slotStart: ClockTime;
  slotEnd: ClockTime;
  recipientName: string;
  recipientPhone: string;
  address: string;
  senderName: string;
  senderPhone: string;
  total: Kurus;
  timeline: TimelineEvent[];
}

export interface TicketDetail extends TicketSummary {
  messages: TicketMessage[];
  order: SupportOrderView | null;
}

/** notification_log */
export interface NotificationLog {
  id: string;
  shopId: string;
  orderNumber: string | null;
  channel: "sms" | "email";
  text: string;
  recipient: string;
  delivered: boolean;
  providerResponse: string | null;
  at: string;
}

export interface SupportNote {
  id: string;
  shopId: string;
  authorName: string;
  text: string;
  at: string;
}

export interface ShopSummary {
  shop: Shop;
  district: string;
  since: IsoDate;
  monthlyOrders: number;
  openTickets: number;
  lastActivityAt: string | null;
}

export interface ShopOverview extends ShopSummary {
  paymentAccount: string;
  lastLogin: { at: string; userName: string } | null;
  recentOrders: SupportOrderView[];
  notifications: NotificationLog[];
  smsUsed: number;
  smsLimit: number;
  notes: SupportNote[];
  users: ShopUser[];
  tickets: TicketSummary[];
  status: ShopStatusDetail;
  /** Teslim edilmeyi bekleyen siparişler: yeni, hazırlanıyor, yolda. */
  openOrders: number;
  /** En yeni 20 yorum, gizlenenler dahil. */
  reviews: Review[];
}

/** audit_log; yalnızca eklenir. */
export interface AuditEntry {
  id: string;
  actorName: string;
  shopName: string | null;
  action: string;
  record: string;
  reason: string | null;
  at: string;
}

export interface CannedReply {
  id: string;
  title: string;
  text: string;
  category: TicketCategory;
}

export interface SupportSearchResult {
  orders: (SupportOrderView & { shopName: string })[];
  shops: ShopSummary[];
  tickets: TicketSummary[];
}

/** Panelden açılan talep. */
export interface TicketInput {
  subject: string;
  category: string;
  orderNumber: string;
  text: string;
}

export interface PilotApplicationInput {
  shopName: string;
  phone: string;
  district: string;
  instagram: string;
}

// Alıcı ana sayfası (api: discovery modülü)

/** Teslim edilen semt; `neighborhood` boşsa ilçenin tamamı. */
export interface Area {
  district: string;
  neighborhood: string | null;
}

/** Dükkânın seçilen gün o semte teslim edip edemeyeceği. */
export const Availability = {
  Open: "open",
  SameDayClosed: "same_day_closed",
  Full: "full",
  Closed: "closed",
} as const;
export type Availability = ValueOf<typeof Availability>;

/** Ana sayfada dükkân satırındaki ürün. `price` en küçük boyla en düşük fiyat; `priceFrom` birden çok boy var. */
export interface ProductCard {
  id: string;
  name: string;
  price: Kurus;
  priceFrom: boolean;
  photoUrl: string | null;
}

/** Seçilen semte teslim eden dükkân. `cutoff` yalnızca bugün ve sipariş verilebilirken dolu. */
export interface ShopMatch {
  slug: string;
  name: string;
  address: string;
  descriptionShort: string;
  deliveryFee: Kurus;
  availability: Availability;
  cutoff: ClockTime | null;
  slots: { start: ClockTime; end: ClockTime }[];
  /** Sipariş verilemiyorsa ilk müsait gün ve aralık. */
  next: { date: IsoDate; start: ClockTime; end: ClockTime } | null;
  products: ProductCard[];
}

export interface ShopPick {
  shopSlug: string;
  shopName: string;
  product: ProductCard;
}

/** Dükkân bilinmeden bulunan siparişin takip adresi. */
export interface OrderRef {
  slug: string;
  token: string;
}

// ---------------------------------------------------------------- yorumlar

/**
 * Bir siparişin yorumu (api review modülü). Ad ("Elif Y." ya da "Bir alıcı") ve semt yazıldığı
 * anda kopyalanır. Gizlenen yorum yalnızca panelde ve destekte görünür.
 */
export interface Review {
  id: string;
  shopId: string;
  orderNumber: string;
  /** 1–5. */
  rating: number;
  /** Boş olabilir; en çok 500 karakter. */
  text: string;
  authorName: string;
  district: string;
  createdAt: string;
  products: { productId: string; productName: string }[];
  hiddenAt: string | null;
  hiddenReason: string | null;
}

/** Görünür yorumların ortalaması (bir ondalık) ve sayısı. */
export interface Rating {
  average: number;
  count: number;
}

/** Vitrin: dükkânın ve yorumu olan her ürünün puanı. */
export interface ShopRatings {
  shop: Rating;
  products: Record<string, Rating>;
}

export interface ProductReviews {
  rating: Rating;
  /** En yeni 30 görünür yorum. */
  reviews: Review[];
}

/** Alıcı ana sayfasındaki "Alıcılar ne diyor". */
export interface RecentReview {
  id: string;
  rating: number;
  text: string;
  authorName: string;
  district: string;
  createdAt: string;
  productName: string;
  shopSlug: string;
  shopName: string;
}

/**
 * Takip sayfasındaki yorum bölümü. Yazılamıyorsa `reason`: teslim edilmedi, teslimden 30 gün
 * geçti ya da yorum yazıldı (`review`).
 */
export interface ReviewState {
  canWrite: boolean;
  reason: "not_delivered" | "review_closed" | "already_reviewed" | null;
  /** Yorumun görüneceği ad, ör. "Ayşe D."; "adım görünmesin" seçilirse "Bir alıcı". */
  authorName: string;
  productName: string;
  review: Review | null;
}

export interface ReviewInput {
  rating: number | null;
  text: string;
  hideName: boolean;
}

export type ReviewField = "rating" | "text" | "order";
