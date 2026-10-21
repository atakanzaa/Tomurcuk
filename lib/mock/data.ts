// Tasarımlardaki örnek veriler (design/screens). Backend gelene kadar tek veri kaynağı.
import {
  OptionKind,
  OrderSource,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  ShopPlan,
  type Category,
  type DeliveryZone,
  type Order,
  type OrderItem,
  type Product,
  type ProductOption,
  type Shop,
  type TimeSlot,
} from "@/lib/api/types";

const SHOP_ID = "shop_nergis";

export const shops: Shop[] = [
  {
    id: SHOP_ID,
    name: "Nergis Çiçek Atölyesi",
    shortName: "Nergis",
    slug: "nergis",
    previousSlugs: ["nergis-cicek-atolyesi"],
    phone: "0216 338 00 00",
    address: "Caferağa Mah. Moda Cad. No: 41, Kadıköy",
    logoUrl: null,
    active: true,
    plan: ShopPlan.Pilot,
    sameDayCutoff: "15:00",
    timeZone: "Europe/Istanbul",
    description:
      "Moda'da 2009'dan beri. Buketleri her sabah halden gelen çiçeklerle hazırlıyor, Kadıköy, Üsküdar ve Ataşehir'e aynı gün teslim ediyoruz.",
    descriptionShort:
      "Moda'da 2009'dan beri. Kadıköy, Üsküdar ve Ataşehir'e aynı gün teslim ediyoruz.",
    openingHours: "Her gün 09:00–20:00",
    featuredProductId: "p_lale",
  },
];

export const categories: Category[] = [
  { id: "c_buket", shopId: SHOP_ID, slug: "buketler", name: "Buketler", order: 1 },
  { id: "c_orkide", shopId: SHOP_ID, slug: "orkideler", name: "Orkideler", order: 2 },
  { id: "c_saksi", shopId: SHOP_ID, slug: "saksi-cicekleri", name: "Saksı çiçekleri", order: 3 },
  { id: "c_celenk", shopId: SHOP_ID, slug: "celenkler", name: "Çelenkler", order: 4 },
];

type OptionSeed = Omit<ProductOption, "id" | "productId">;

const sizes = (small: string, medium: string, large: string, mediumExtra: number, largeExtra: number): OptionSeed[] => [
  { name: "Küçük", detail: small, kind: OptionKind.Size, extraPrice: 0 },
  { name: "Orta", detail: medium, kind: OptionKind.Size, extraPrice: mediumExtra },
  { name: "Büyük", detail: large, kind: OptionKind.Size, extraPrice: largeExtra },
];
const vase: OptionSeed = { name: "Cam vazo", detail: null, kind: OptionKind.Vase, extraPrice: 18000 };
const chocolate: OptionSeed = {
  name: "El yapımı çikolata, 12 adet",
  detail: null,
  kind: OptionKind.Addon,
  extraPrice: 24000,
};

type ProductSeed = Omit<Product, "shopId" | "active" | "order" | "options" | "photoUrl"> & {
  options?: OptionSeed[];
  active?: boolean;
};

const productSeeds: ProductSeed[] = [
  {
    id: "p_lale",
    categoryId: "c_buket",
    name: "Bu haftanın lalesi",
    description: "Hollanda lalesi, kraft kâğıda sarılı ve rafyayla bağlı. Vazoda 5–7 gün dayanır.",
    summary: "Hollanda lalesi, 15 dal, kraft sarımlı. Haftada bir değişir.",
    price: 72000,
    options: [...sizes("15 dal", "25 dal", "40 dal", 33000, 76000), vase, chocolate],
  },
  {
    id: "p_mevsim",
    categoryId: "c_buket",
    name: "Mevsim buketi",
    description: "Haftanın en taze çiçeklerinden, çiçekçinin seçimiyle hazırlanan buket.",
    summary: "Aynı gün",
    price: 85000,
    options: [...sizes("9 dal", "15 dal", "25 dal", 25000, 55000), vase, chocolate],
  },
  {
    id: "p_beyaz_gul",
    categoryId: "c_buket",
    name: "Beyaz güller",
    description: "On iki dal beyaz gül, okaliptüs yapraklarıyla.",
    summary: "12 dal",
    price: 98000,
    options: [vase, chocolate],
  },
  {
    id: "p_orkide",
    categoryId: "c_orkide",
    name: "Mor orkide",
    description: "İki dallı mor orkide, seramik saksıda.",
    summary: "Saksıda",
    price: 160000,
  },
  {
    id: "p_kir",
    categoryId: "c_buket",
    name: "Kır buketi",
    description: "Kır çiçekleri ve otlarla serbest bağlanmış buket.",
    summary: "Aynı gün",
    price: 65000,
    options: [...sizes("Tek sarım", "Dolgun", "Kucak dolusu", 20000, 45000), vase],
  },
  {
    id: "p_sakayik",
    categoryId: "c_buket",
    name: "Pembe şakayık",
    description: "Yedi dal pembe şakayık. Yalnızca mevsiminde.",
    summary: "7 dal, mevsiminde",
    price: 135000,
    options: [vase],
  },
  {
    id: "p_papatya",
    categoryId: "c_buket",
    name: "Papatya kutusu",
    description: "Kraft kutuda papatya aranjmanı.",
    summary: "Aynı gün",
    price: 54000,
  },
  {
    id: "p_monstera",
    categoryId: "c_saksi",
    name: "Monstera",
    description: "60 cm boyunda monstera, toprak saksıda.",
    summary: "Saksıda, 60 cm",
    price: 110000,
  },
  {
    id: "p_celenk",
    categoryId: "c_celenk",
    name: "Ayaklı çelenk",
    description: "Açılış ve tören için ayaklı çelenk. En az bir gün önceden sipariş verilir.",
    summary: "1 gün önceden",
    price: 240000,
  },
];

export const products: Product[] = productSeeds.map(({ options = [], active = true, ...seed }, index) => ({
  ...seed,
  shopId: SHOP_ID,
  active,
  order: index + 1,
  photoUrl: `mock:${seed.id}`,
  options: options.map((option, optionIndex) => ({
    ...option,
    id: `${seed.id}_o${optionIndex + 1}`,
    productId: seed.id,
  })),
}));

export const deliveryZones: DeliveryZone[] = [
  { id: "z_osmanaga", shopId: SHOP_ID, district: "Kadıköy", neighborhood: "Osmanağa", fee: 6000, active: true },
  { id: "z_caferaga", shopId: SHOP_ID, district: "Kadıköy", neighborhood: "Caferağa", fee: 9000, active: true },
  { id: "z_fenerbahce", shopId: SHOP_ID, district: "Kadıköy", neighborhood: "Fenerbahçe", fee: 9000, active: true },
  { id: "z_kosuyolu", shopId: SHOP_ID, district: "Kadıköy", neighborhood: "Koşuyolu", fee: 9000, active: true },
  { id: "z_acibadem", shopId: SHOP_ID, district: "Üsküdar", neighborhood: "Acıbadem", fee: 10000, active: true },
  { id: "z_kuzguncuk", shopId: SHOP_ID, district: "Üsküdar", neighborhood: "Kuzguncuk", fee: 12000, active: true },
  { id: "z_atasehir", shopId: SHOP_ID, district: "Ataşehir", neighborhood: null, fee: 12000, active: true },
];

export const timeSlots: TimeSlot[] = [
  { id: "s_sabah", shopId: SHOP_ID, start: "10:00", end: "13:00", capacity: 6 },
  { id: "s_ogle", shopId: SHOP_ID, start: "13:00", end: "16:00", capacity: 8 },
  { id: "s_aksam", shopId: SHOP_ID, start: "16:00", end: "19:00", capacity: 8 },
];

/** Teslimat ekranındaki örnek: sabah dolu, öğle 3 yer, akşam müsait. */
export const remainingBySlot: Record<string, number> = { s_sabah: 0, s_ogle: 3, s_aksam: 8 };

const DELIVERY_DATE = "2026-10-22";

type OrderSeed = Pick<
  Order,
  | "id"
  | "number"
  | "status"
  | "recipientName"
  | "zoneName"
  | "deliveryZoneId"
  | "timeSlotId"
  | "slotStart"
  | "slotEnd"
  | "deliveryTime"
  | "total"
> &
  Partial<Omit<Order, "items">> & { items: Omit<OrderItem, "id" | "orderId">[] };

const orderSeeds: OrderSeed[] = [
  {
    id: "o_4815",
    number: "T-4815",
    status: OrderStatus.Preparing,
    recipientName: "Zeynep Aksoy",
    zoneName: "Moda, Kadıköy",
    deliveryZoneId: "z_caferaga",
    timeSlotId: "s_sabah",
    slotStart: "10:00",
    slotEnd: "13:00",
    deliveryTime: "11:40",
    total: 125000,
    items: [
      {
        productId: "p_mevsim",
        productName: "Mevsim buketi",
        unitPrice: 85000,
        quantity: 1,
        options: [
          { name: "Orta", kind: OptionKind.Size, extraPrice: 25000 },
          { name: "Cam vazo", kind: OptionKind.Vase, extraPrice: 18000 },
        ],
      },
    ],
  },
  {
    id: "o_4816",
    number: "T-4816",
    status: OrderStatus.OnWay,
    trackingToken: "y7Kp2RvXq9LmT3sB",
    courierName: "Murat",
    events: [
      { status: OrderStatus.New, at: "2026-10-21T08:05:00Z" },
      { status: OrderStatus.Preparing, at: "2026-10-22T06:30:00Z" },
      { status: OrderStatus.OnWay, at: "2026-10-22T08:40:00Z" },
    ],
    recipientName: "Can Öztürk",
    zoneName: "Acıbadem, Üsküdar",
    deliveryZoneId: "z_acibadem",
    timeSlotId: "s_sabah",
    slotStart: "10:00",
    slotEnd: "13:00",
    deliveryTime: "12:00",
    total: 169000,
    items: [{ productId: "p_orkide", productName: "Mor orkide", unitPrice: 160000, quantity: 1, options: [] }],
  },
  {
    id: "o_4817",
    number: "T-4817",
    status: OrderStatus.Delivered,
    trackingToken: "d4Wn8HcZp1QaE6uJ",
    courierName: "Murat",
    deliveryPhotoUrl: "mock:delivery",
    cardNote: "Nice yıllara, iyi ki varsın.",
    anonymous: true,
    senderName: "Deniz",
    events: [
      { status: OrderStatus.New, at: "2026-10-21T09:12:00Z" },
      { status: OrderStatus.Preparing, at: "2026-10-22T06:05:00Z" },
      { status: OrderStatus.OnWay, at: "2026-10-22T09:00:00Z" },
      { status: OrderStatus.Delivered, at: "2026-10-22T09:30:00Z" },
    ],
    recipientName: "Selin Arslan",
    zoneName: "Fenerbahçe, Kadıköy",
    deliveryZoneId: "z_fenerbahce",
    timeSlotId: "s_sabah",
    slotStart: "10:00",
    slotEnd: "13:00",
    deliveryTime: "12:30",
    total: 74000,
    items: [{ productId: "p_kir", productName: "Kır buketi", unitPrice: 65000, quantity: 1, options: [] }],
  },
  {
    id: "o_4821",
    number: "T-4821",
    status: OrderStatus.New,
    paymentStatus: PaymentStatus.Paid,
    trackingToken: "a3Fq9ZmLx2VbN8cR",
    senderPhone: "0533 207 41 65",
    events: [{ status: OrderStatus.New, at: "2026-10-21T10:52:00Z" }],
    recipientName: "Elif Yılmaz",
    recipientPhone: "0532 412 88 19",
    address: "Moda Cad. Şair Nefi Sok. No: 12, Daire 4, Caferağa, Kadıköy",
    courierNote: "Zil çalışmıyor, arayın.",
    cardNote: "Yeni evin hayırlı olsun, ilk çiçekler bizden.",
    senderName: "Ayşe ve Can",
    zoneName: "Caferağa, Kadıköy",
    deliveryZoneId: "z_caferaga",
    timeSlotId: "s_ogle",
    slotStart: "13:00",
    slotEnd: "16:00",
    deliveryTime: null,
    subtotal: 123000,
    deliveryFee: 9000,
    total: 132000,
    items: [
      {
        productId: "p_lale",
        productName: "Bu haftanın lalesi",
        unitPrice: 72000,
        quantity: 1,
        options: [
          { name: "Orta", kind: OptionKind.Size, extraPrice: 33000 },
          { name: "Cam vazo", kind: OptionKind.Vase, extraPrice: 18000 },
        ],
      },
    ],
  },
  {
    id: "o_4822",
    number: "T-4822",
    status: OrderStatus.New,
    source: OrderSource.Phone,
    recipientName: "Mert Kaya",
    zoneName: "Kuzguncuk, Üsküdar",
    deliveryZoneId: "z_kuzguncuk",
    timeSlotId: "s_ogle",
    slotStart: "13:00",
    slotEnd: "16:00",
    deliveryTime: "14:00",
    exactTime: true,
    total: 107000,
    items: [{ productId: "p_beyaz_gul", productName: "Beyaz güller (12 dal)", unitPrice: 98000, quantity: 1, options: [] }],
  },
  {
    id: "o_4823",
    number: "T-4823",
    status: OrderStatus.New,
    source: OrderSource.WhatsApp,
    paymentStatus: PaymentStatus.Unpaid,
    paymentMethod: PaymentMethod.Transfer,
    recipientName: "Duygu Şahin",
    zoneName: "Ataşehir merkez",
    deliveryZoneId: "z_atasehir",
    timeSlotId: "s_ogle",
    slotStart: "13:00",
    slotEnd: "16:00",
    deliveryTime: null,
    total: 252000,
    items: [{ productId: "p_celenk", productName: "Ayaklı çelenk", unitPrice: 240000, quantity: 1, options: [] }],
  },
];

export const orders: Order[] = orderSeeds.map(({ items, ...seed }) => ({
  trackingToken: `mock-${seed.id}`,
  senderPhone: "0532 000 00 00",
  courierName: null,
  events: [{ status: seed.status, at: "2026-10-21T10:52:00Z" }],
  shopId: SHOP_ID,
  customerId: `cu_${seed.id}`,
  source: OrderSource.Link,
  paymentStatus: PaymentStatus.Paid,
  paymentMethod: PaymentMethod.Card,
  deliveryDate: DELIVERY_DATE,
  exactTime: false,
  recipientPhone: "",
  address: "",
  courierNote: null,
  cardNote: null,
  senderName: null,
  anonymous: false,
  subtotal: seed.total,
  deliveryFee: 0,
  deliveryPhotoUrl: null,
  createdAt: "2026-10-21T10:52:00Z",
  ...seed,
  items: items.map((item, index) => ({ ...item, id: `${seed.id}_i${index + 1}`, orderId: seed.id })),
}));
