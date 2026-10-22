// Tasarımlardaki örnek veriler (design/screens). Backend gelene kadar tek veri kaynağı.
import {
  OptionKind,
  OrderSource,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  ShopPlan,
  ShopRole,
  type Category,
  type Customer,
  type DeliveryZone,
  type Order,
  type OrderItem,
  type Product,
  type ProductOption,
  type Shop,
  type ShopUser,
  type SpecialDay,
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
    plan: ShopPlan.Pro,
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

/** Destek panelinde görünen diğer dükkânlar; vitrin verileri bu demoda yok. */
const otherShop = (id: string, name: string, shortName: string, slug: string, address: string, active = true): Shop => ({
  id,
  name,
  shortName,
  slug,
  previousSlugs: [],
  phone: "0212 000 00 00",
  address,
  logoUrl: null,
  active,
  plan: ShopPlan.Starter,
  sameDayCutoff: "14:00",
  timeZone: "Europe/Istanbul",
  description: "",
  descriptionShort: "",
  openingHours: "Her gün 09:00–19:00",
  featuredProductId: null,
});

shops.push(
  otherShop("shop_lale", "Lale Bahçesi", "Lale", "lale-bahcesi", "Sinanpaşa Mah., Beşiktaş"),
  otherShop("shop_papatya", "Papatya Çiçekçilik", "Papatya", "papatya-cicekcilik", "Cevizli Mah., Kartal"),
  otherShop("shop_begonvil", "Begonvil Atölye", "Begonvil", "begonvil-atolye", "Atatürk Mah., Ataşehir"),
  otherShop("shop_orkide", "Orkide Evi", "Orkide", "orkide-evi", "Zeytinlik Mah., Bakırköy", false),
);

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
  { id: "z_goztepe", shopId: SHOP_ID, district: "Kadıköy", neighborhood: "Göztepe", fee: 9000, active: true },
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

/**
 * Tasarımlardaki "bugün" (22 Ekim). Mock, ilk istekte bütün tarihleri bu günün
 * gerçek bugüne denk geleceği kadar kaydırır (store.ts); demo her gün dolu görünür.
 */
export const BASE_DATE = "2026-10-22";

/** Taban günden `dayOffset` gün sonra, İstanbul saatiyle "HH:mm" → ISO (UTC). */
const at = (dayOffset: number, time: string) => {
  const d = new Date(`${BASE_DATE}T${time}:00+03:00`);
  d.setUTCDate(d.getUTCDate() + dayOffset);
  return d.toISOString();
};
const day = (dayOffset: number) => at(dayOffset, "12:00").slice(0, 10);

export const customers: Customer[] = [
  { id: "cu_ayse", name: "Ayşe Demir", phone: "0533 207 41 65", marketingConsent: true },
  { id: "cu_kerem", name: "Kerem Öztürk", phone: "0541 220 31 03", marketingConsent: true },
  { id: "cu_deniz", name: "Deniz Arslan", phone: "0505 310 22 47", marketingConsent: false },
  { id: "cu_ali", name: "Ali Aksoy", phone: "0532 555 18 40", marketingConsent: true },
  { id: "cu_gizem", name: "Gizem Kaya", phone: "0544 318 09 12", marketingConsent: true },
  { id: "cu_hakan", name: "Hakan Şahin", phone: "0535 761 44 20", marketingConsent: false },
  { id: "cu_burak", name: "Burak Çelik", phone: "0532 640 77 15", marketingConsent: true },
  { id: "cu_zeynep", name: "Zeynep Aksoy", phone: "0536 402 11 58", marketingConsent: true },
  { id: "cu_okan", name: "Okan Yıldız", phone: "0533 980 12 64", marketingConsent: true },
  { id: "cu_nilay", name: "Nilay Koç", phone: "0532 111 22 33", marketingConsent: false },
].map((c) => ({ ...c, shopId: SHOP_ID, email: null, note: null }));

/** Özel günler taban güne göre: 24 Ekim Cuma, 26 Ekim Pazar, 28 Ekim Salı. Gün ve ay store'da hesaplanır. */
export const specialDaySeeds: (Omit<SpecialDay, "day" | "month"> & { dayOffset: number })[] = [
  { id: "sd_1", customerId: "cu_ayse", title: "Annesi Gül Hanım'ın doğum günü", recipientName: "Gül Demir", dayOffset: 2 },
  { id: "sd_2", customerId: "cu_burak", title: "Evlilik yıl dönümü", recipientName: "Ece Çelik", dayOffset: 2 },
  { id: "sd_3", customerId: "cu_zeynep", title: "Ablası Derya'nın doğum günü", recipientName: "Derya Aksoy", dayOffset: 4 },
  { id: "sd_4", customerId: "cu_okan", title: "Ofis açılış yıl dönümü", recipientName: null, dayOffset: 4 },
  { id: "sd_5", customerId: "cu_nilay", title: "Kızının doğum günü", recipientName: "Defne Koç", dayOffset: 6 },
  { id: "sd_6", customerId: "cu_gizem", title: "Annesinin doğum günü", recipientName: null, dayOffset: 40 },
];

export const shopUsers: ShopUser[] = [
  { id: "su_ayla", shopId: SHOP_ID, name: "Ayla Er", email: "ayla@nergiscicek.com", role: ShopRole.Owner, lastSeenAt: at(0, "14:05") },
  { id: "su_kemal", shopId: SHOP_ID, name: "Kemal Er", email: "kemal@nergiscicek.com", role: ShopRole.Staff, lastSeenAt: at(-1, "18:20") },
];

type OrderSeed = Pick<
  Order,
  "id" | "number" | "customerId" | "status" | "recipientName" | "zoneName" | "deliveryZoneId" | "timeSlotId" | "slotStart" | "slotEnd" | "deliveryTime" | "total"
> &
  Partial<Omit<Order, "items">> & { items: Omit<OrderItem, "id" | "orderId">[] };

const item = (productId: string, productName: string, unitPrice: number, options: OrderItem["options"] = []) => ({
  productId,
  productName,
  unitPrice,
  quantity: 1,
  options,
});
const size = (name: string, extraPrice: number) => ({ name, kind: OptionKind.Size, extraPrice });
const vaseOption = { name: "Cam vazo", kind: OptionKind.Vase, extraPrice: 18000 };
const slot = {
  sabah: { timeSlotId: "s_sabah", slotStart: "10:00", slotEnd: "13:00" },
  ogle: { timeSlotId: "s_ogle", slotStart: "13:00", slotEnd: "16:00" },
  aksam: { timeSlotId: "s_aksam", slotStart: "16:00", slotEnd: "19:00" },
};

/** Geçmişte teslim edilmiş sipariş: müşteri kartı ve "geçen yıl" bilgisi için. */
function pastOrder(id: string, customerId: string, dayOffset: number, productName: string, total: number): OrderSeed {
  return {
    id: `o_${id}`,
    number: `T-${id}`,
    customerId,
    status: OrderStatus.Delivered,
    recipientName: "",
    zoneName: "Caferağa, Kadıköy",
    deliveryZoneId: "z_caferaga",
    ...slot.ogle,
    deliveryTime: "14:10",
    total,
    deliveryDate: day(dayOffset),
    createdAt: at(dayOffset - 1, "18:30"),
    events: [
      { status: OrderStatus.New, at: at(dayOffset - 1, "18:30") },
      { status: OrderStatus.Delivered, at: at(dayOffset, "14:10") },
    ],
    items: [item("", productName, total)],
  };
}

const orderSeeds: OrderSeed[] = [
  {
    id: "o_4815",
    number: "T-4815",
    customerId: "cu_ali",
    status: OrderStatus.Preparing,
    recipientName: "Zeynep Aksoy",
    recipientPhone: "0536 402 11 58",
    address: "Moda Cad. No: 88, Daire 2",
    zoneName: "Moda, Kadıköy",
    deliveryZoneId: "z_caferaga",
    ...slot.sabah,
    deliveryTime: "11:40",
    createdAt: at(-1, "16:20"),
    events: [
      { status: OrderStatus.New, at: at(-1, "16:20") },
      { status: OrderStatus.Preparing, at: at(0, "09:30") },
    ],
    total: 125000,
    items: [item("p_mevsim", "Mevsim buketi", 85000, [size("Orta", 25000), vaseOption])],
  },
  {
    id: "o_4816",
    number: "T-4816",
    customerId: "cu_kerem",
    status: OrderStatus.OnWay,
    trackingToken: "y7Kp2RvXq9LmT3sB",
    courierName: "Murat",
    recipientName: "Can Öztürk",
    recipientPhone: "0541 330 52 03",
    address: "Çeçen Sok. No: 8, Daire 3",
    zoneName: "Acıbadem, Üsküdar",
    deliveryZoneId: "z_acibadem",
    ...slot.sabah,
    deliveryTime: "12:00",
    createdAt: at(-1, "11:05"),
    events: [
      { status: OrderStatus.New, at: at(-1, "11:05") },
      { status: OrderStatus.Preparing, at: at(0, "09:30") },
      { status: OrderStatus.OnWay, at: at(0, "11:40") },
    ],
    total: 169000,
    subtotal: 160000,
    deliveryFee: 9000,
    items: [item("p_orkide", "Mor orkide", 160000)],
  },
  {
    id: "o_4817",
    number: "T-4817",
    customerId: "cu_deniz",
    status: OrderStatus.Delivered,
    trackingToken: "d4Wn8HcZp1QaE6uJ",
    courierName: "Murat",
    deliveryPhotoUrl: "mock:delivery",
    cardNote: "Nice yıllara, iyi ki varsın.",
    anonymous: true,
    senderName: "Deniz",
    recipientName: "Selin Arslan",
    recipientPhone: "0505 412 60 47",
    address: "Fener Kalamış Cad. No: 41",
    zoneName: "Fenerbahçe, Kadıköy",
    deliveryZoneId: "z_fenerbahce",
    ...slot.sabah,
    deliveryTime: "12:30",
    createdAt: at(-1, "12:12"),
    events: [
      { status: OrderStatus.New, at: at(-1, "12:12") },
      { status: OrderStatus.Preparing, at: at(0, "09:05") },
      { status: OrderStatus.OnWay, at: at(0, "12:00") },
      { status: OrderStatus.Delivered, at: at(0, "12:30") },
    ],
    total: 74000,
    items: [item("p_kir", "Kır buketi", 65000)],
  },
  {
    id: "o_4821",
    number: "T-4821",
    customerId: "cu_ayse",
    status: OrderStatus.New,
    trackingToken: "a3Fq9ZmLx2VbN8cR",
    recipientName: "Elif Yılmaz",
    recipientPhone: "0532 412 88 19",
    address: "Moda Cad. Şair Nefi Sok. No: 12, Daire 4",
    courierNote: "Zil çalışmıyor, arayın.",
    cardNote: "Yeni evin hayırlı olsun, ilk çiçekler bizden.",
    senderName: "Ayşe ve Can",
    zoneName: "Caferağa, Kadıköy",
    deliveryZoneId: "z_caferaga",
    ...slot.ogle,
    deliveryTime: null,
    createdAt: at(-1, "13:52"),
    events: [{ status: OrderStatus.New, at: at(-1, "13:52") }],
    subtotal: 123000,
    deliveryFee: 9000,
    total: 132000,
    items: [item("p_lale", "Bu haftanın lalesi", 72000, [size("Orta", 33000), vaseOption])],
  },
  {
    id: "o_4822",
    number: "T-4822",
    customerId: "cu_gizem",
    status: OrderStatus.New,
    source: OrderSource.Phone,
    recipientName: "Mert Kaya",
    recipientPhone: "0544 702 18 30",
    address: "Simitçi Şakir Sok. No: 5",
    zoneName: "Kuzguncuk, Üsküdar",
    deliveryZoneId: "z_kuzguncuk",
    ...slot.ogle,
    deliveryTime: "14:00",
    exactTime: true,
    createdAt: at(0, "08:40"),
    events: [{ status: OrderStatus.New, at: at(0, "08:40") }],
    total: 107000,
    items: [item("p_beyaz_gul", "Beyaz güller (12 dal)", 98000)],
  },
  {
    id: "o_4823",
    number: "T-4823",
    customerId: "cu_hakan",
    status: OrderStatus.New,
    source: OrderSource.WhatsApp,
    paymentStatus: PaymentStatus.Unpaid,
    paymentMethod: PaymentMethod.Transfer,
    recipientName: "Duygu Şahin",
    recipientPhone: "0535 118 90 21",
    address: "Ataşehir Bulvarı, Gardenya 4, Kat 9",
    zoneName: "Ataşehir merkez",
    deliveryZoneId: "z_atasehir",
    ...slot.ogle,
    deliveryTime: null,
    createdAt: at(0, "09:10"),
    events: [{ status: OrderStatus.New, at: at(0, "09:10") }],
    total: 252000,
    items: [item("p_celenk", "Ayaklı çelenk", 240000)],
  },
  // Yarın ve bu hafta
  {
    id: "o_4824",
    number: "T-4824",
    customerId: "cu_burak",
    status: OrderStatus.New,
    recipientName: "Ece Çelik",
    recipientPhone: "0532 640 77 16",
    address: "Paşa Limanı Cad. No: 22",
    zoneName: "Kuzguncuk, Üsküdar",
    deliveryZoneId: "z_kuzguncuk",
    ...slot.sabah,
    deliveryTime: null,
    deliveryDate: day(1),
    createdAt: at(0, "10:15"),
    events: [{ status: OrderStatus.New, at: at(0, "10:15") }],
    total: 110000,
    items: [item("p_beyaz_gul", "Beyaz güller (12 dal)", 98000)],
  },
  {
    id: "o_4825",
    number: "T-4825",
    customerId: "cu_nilay",
    status: OrderStatus.New,
    source: OrderSource.Instagram,
    paymentStatus: PaymentStatus.Pending,
    paymentMethod: PaymentMethod.Cash,
    recipientName: "Defne Koç",
    recipientPhone: "0532 111 22 34",
    address: "Bahariye Cad. No: 60",
    zoneName: "Caferağa, Kadıköy",
    deliveryZoneId: "z_caferaga",
    ...slot.aksam,
    deliveryTime: null,
    deliveryDate: day(1),
    createdAt: at(0, "11:30"),
    events: [{ status: OrderStatus.New, at: at(0, "11:30") }],
    total: 74000,
    items: [item("p_kir", "Kır buketi", 65000)],
  },
  {
    id: "o_4826",
    number: "T-4826",
    customerId: "cu_ayse",
    status: OrderStatus.New,
    recipientName: "Gül Demir",
    recipientPhone: "0533 207 41 66",
    address: "Rıhtım Cad. No: 3, Daire 7",
    zoneName: "Caferağa, Kadıköy",
    deliveryZoneId: "z_caferaga",
    ...slot.sabah,
    deliveryTime: null,
    deliveryDate: day(2),
    cardNote: "İyi ki doğdun anneciğim.",
    senderName: "Ayşe",
    createdAt: at(0, "12:05"),
    events: [{ status: OrderStatus.New, at: at(0, "12:05") }],
    total: 119000,
    items: [item("p_mevsim", "Mevsim buketi", 85000, [size("Orta", 25000)])],
  },
  // Dün teslim edilemeyen
  {
    id: "o_4809",
    number: "T-4809",
    customerId: "cu_okan",
    status: OrderStatus.Failed,
    recipientName: "Okan Yıldız Ofis",
    recipientPhone: "0216 455 10 10",
    address: "Barbaros Mah. Mor Sümbül Sok. No: 7",
    zoneName: "Ataşehir merkez",
    deliveryZoneId: "z_atasehir",
    ...slot.aksam,
    deliveryTime: null,
    deliveryDate: day(-1),
    createdAt: at(-3, "10:00"),
    events: [
      { status: OrderStatus.New, at: at(-3, "10:00") },
      { status: OrderStatus.Preparing, at: at(-1, "14:00") },
      { status: OrderStatus.OnWay, at: at(-1, "16:30") },
      { status: OrderStatus.Failed, at: at(-1, "18:10") },
    ],
    total: 240000,
    items: [item("p_celenk", "Ayaklı çelenk", 240000)],
  },
  // Geçmiş siparişler
  pastOrder("4820", "cu_ayse", -1, "Papatya kutusu", 63000),
  pastOrder("4790", "cu_ali", -5, "Pembe şakayık", 144000),
  pastOrder("4501", "cu_ayse", -60, "Beyaz güller (12 dal)", 107000),
  pastOrder("4302", "cu_ayse", -120, "Mor orkide", 169000),
  pastOrder("4011", "cu_ayse", -200, "Kır buketi", 74000),
  pastOrder("3120", "cu_ayse", -363, "Mevsim buketi", 85000),
  pastOrder("3119", "cu_burak", -363, "Kırmızı güller", 140000),
  pastOrder("3140", "cu_zeynep", -361, "Pembe şakayık", 135000),
  pastOrder("3141", "cu_okan", -361, "Ayaklı çelenk", 240000),
];

export const orders: Order[] = orderSeeds.map(({ items, ...seed }) => ({
  trackingToken: `mock-${seed.id}`,
  senderPhone: customers.find((c) => c.id === seed.customerId)?.phone ?? "",
  courierName: null,
  events: [{ status: seed.status, at: seed.createdAt ?? at(-1, "10:00") }],
  shopId: SHOP_ID,
  source: OrderSource.Link,
  paymentStatus: PaymentStatus.Paid,
  paymentMethod: PaymentMethod.Card,
  deliveryDate: BASE_DATE,
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
  createdAt: at(-1, "10:00"),
  ...seed,
  items: items.map((entry, index) => ({ ...entry, id: `${seed.id}_i${index + 1}`, orderId: seed.id })),
}));
