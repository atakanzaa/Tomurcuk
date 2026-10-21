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
  /** Abonelik bitince veya askıya alınınca false; vitrin sipariş almaz, veri silinmez. */
  active: boolean;
  plan: ShopPlan;
  /** Aynı gün teslim için son sipariş saati. */
  sameDayCutoff: ClockTime;
  timeZone: string;
  /** Vitrin girişindeki tanıtım metni (masaüstü). */
  description: string;
  /** Mobilde gösterilen kısa tanıtım metni. */
  descriptionShort: string;
  openingHours: string;
  featuredProductId: string | null;
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
  photoUrl: string | null;
  active: boolean;
  order: number;
  options: ProductOption[];
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

/** Bir günün saat aralığı için kalan kapasite. */
export interface SlotAvailability {
  slotId: string;
  date: IsoDate;
  remaining: number;
}

/** customer */
export interface Customer {
  id: string;
  shopId: string;
  name: string;
  phone: string;
  email: string | null;
  note: string | null;
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
