// Destek paneli tasarımlarındaki örnekler (design/screens/destek). Talep zamanları
// "şimdiden kaç dakika önce" olarak tutulur; store ilk istekte gerçek zamana çevirir.
import {
  SupportRole,
  TicketCategory,
  TicketPriority,
  TicketStatus,
  type CannedReply,
  type SupportUser,
} from "@/lib/api/types";

export const supportUsers: SupportUser[] = [
  { id: "pu_selin", name: "Selin Karaca", role: SupportRole.Agent },
  { id: "pu_mert", name: "Mert Arslan", role: SupportRole.Agent },
  { id: "pu_derya", name: "Derya Kılıç", role: SupportRole.Lead },
];

/** Oturumdaki destek kullanıcısı; gerçek uygulamada iki adımlı girişten gelir. */
export const CURRENT_SUPPORT_USER_ID = "pu_selin";

export interface TicketSeed {
  id: string;
  subject: string;
  shopId: string;
  orderId: string | null;
  orderNumber: string | null;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  assigneeId: string | null;
  createdMinutesAgo: number;
  waitingMinutesAgo: number;
  firstResponseMinutesAgo: number | null;
  messages: { author: string; org: string; internal: boolean; text: string; minutesAgo: number }[];
}

export const ticketSeeds: TicketSeed[] = [
  {
    id: "tk_1187",
    subject: "Kurye adresi bulamıyor, alıcı telefonu açmıyor",
    shopId: "shop_nergis",
    orderId: "o_4816",
    orderNumber: "T-4816",
    category: TicketCategory.Delivery,
    priority: TicketPriority.Normal,
    status: TicketStatus.Open,
    assigneeId: "pu_selin",
    createdMinutesAgo: 6,
    waitingMinutesAgo: 6,
    firstResponseMinutesAgo: null,
    messages: [
      {
        author: "Ayla Er",
        org: "Nergis Çiçek Atölyesi",
        internal: false,
        text: "Kurye Acıbadem'de, Çeçen Sokak 8'i bulamıyor. Bina numarası yok gibi görünüyor. Alıcıyı iki kez aradık, açmıyor. Çiçekler arabada bekliyor, ne yapalım?",
        minutesAgo: 6,
      },
      {
        author: "Selin Karaca",
        org: "dahili not, dükkân görmez",
        internal: true,
        text: "Zaman çizelgesinde \"yolda\" SMS'i alıcıya ulaşmamış görünüyor. Numara formatı doğru. Gönderen Kerem Öztürk'ü arayıp adresi teyit edeceğim.",
        minutesAgo: 3,
      },
    ],
  },
  {
    id: "tk_1188",
    subject: "Ödeme alındı ama sipariş panelde görünmüyor",
    shopId: "shop_lale",
    orderId: null,
    orderNumber: "T-5102",
    category: TicketCategory.Payment,
    priority: TicketPriority.Urgent,
    status: TicketStatus.Open,
    assigneeId: null,
    createdMinutesAgo: 12,
    waitingMinutesAgo: 12,
    firstResponseMinutesAgo: null,
    messages: [
      {
        author: "Seda Ateş",
        org: "Lale Bahçesi",
        internal: false,
        text: "Müşteri kartından 1.180 TL çekildiğini söylüyor, dekontu da gönderdi. Ama sipariş panelimde yok. Bugün 16:00–19:00 arası teslim edilmesi gerekiyor.",
        minutesAgo: 12,
      },
    ],
  },
  {
    id: "tk_1180",
    subject: "Teslimat bölgelerine Maltepe'yi ekleyemiyorum",
    shopId: "shop_papatya",
    orderId: null,
    orderNumber: null,
    category: TicketCategory.Account,
    priority: TicketPriority.Normal,
    status: TicketStatus.WaitingShop,
    assigneeId: "pu_selin",
    createdMinutesAgo: 190,
    waitingMinutesAgo: 100,
    firstResponseMinutesAgo: 150,
    messages: [
      { author: "Fatma Yurt", org: "Papatya Çiçekçilik", internal: false, text: "Ayarlarda Maltepe'yi seçince kaydet butonu çalışmıyor.", minutesAgo: 190 },
      { author: "Selin Karaca", org: "Tomurcuk Destek", internal: false, text: "Maltepe'nin hangi mahallelerine teslim ettiğinizi yazar mısınız? Bölgeyi mahalleleriyle birlikte ekleyelim.", minutesAgo: 100 },
    ],
  },
  {
    id: "tk_1179",
    subject: "Müşterilere SMS gitmiyor",
    shopId: "shop_begonvil",
    orderId: null,
    orderNumber: null,
    category: TicketCategory.Technical,
    priority: TicketPriority.Normal,
    status: TicketStatus.Open,
    assigneeId: "pu_mert",
    createdMinutesAgo: 120,
    waitingMinutesAgo: 120,
    firstResponseMinutesAgo: null,
    messages: [
      { author: "Can Bilge", org: "Begonvil Atölye", internal: false, text: "Dünden beri sipariş onay SMS'leri müşterilere ulaşmıyor.", minutesAgo: 120 },
    ],
  },
  {
    id: "tk_1176",
    subject: "Ürün fotoğrafı yüklenmiyor",
    shopId: "shop_orkide",
    orderId: null,
    orderNumber: null,
    category: TicketCategory.Technical,
    priority: TicketPriority.Normal,
    status: TicketStatus.Open,
    assigneeId: "pu_mert",
    createdMinutesAgo: 180,
    waitingMinutesAgo: 180,
    firstResponseMinutesAgo: null,
    messages: [
      { author: "Leyla Su", org: "Orkide Evi", internal: false, text: "Telefondan çektiğim fotoğrafı yüklerken hata veriyor.", minutesAgo: 180 },
    ],
  },
  {
    id: "tk_1185",
    subject: "Çikolata seçeneği fiyatı güncellenmiyor",
    shopId: "shop_nergis",
    orderId: null,
    orderNumber: null,
    category: TicketCategory.Technical,
    priority: TicketPriority.Normal,
    status: TicketStatus.Open,
    assigneeId: "pu_mert",
    createdMinutesAgo: 26 * 60,
    waitingMinutesAgo: 22 * 60,
    firstResponseMinutesAgo: 25 * 60,
    messages: [
      { author: "Ayla Er", org: "Nergis Çiçek Atölyesi", internal: false, text: "Çikolata eklemesinin fiyatını 240 TL yaptım ama vitrinde hâlâ 220 TL görünüyor.", minutesAgo: 26 * 60 },
    ],
  },
  {
    id: "tk_1170",
    subject: "Kısmi iade nasıl yapılır?",
    shopId: "shop_nergis",
    orderId: "o_4790",
    orderNumber: "T-4790",
    category: TicketCategory.Payment,
    priority: TicketPriority.Normal,
    status: TicketStatus.Resolved,
    assigneeId: "pu_selin",
    createdMinutesAgo: 30 * 60,
    waitingMinutesAgo: 24 * 60,
    firstResponseMinutesAgo: 29 * 60,
    messages: [
      { author: "Ayla Er", org: "Nergis Çiçek Atölyesi", internal: false, text: "Vazo stokta yoktu, müşteriye vazo ücretini iade etmek istiyorum.", minutesAgo: 30 * 60 },
      { author: "Selin Karaca", org: "Tomurcuk Destek", internal: false, text: "Sipariş detayında \"İade başlat\" ile yalnızca vazo tutarını girebilirsiniz. İade toplamı ödenen tutarı aşamaz.", minutesAgo: 29 * 60 },
    ],
  },
];

export const cannedReplies: CannedReply[] = [
  {
    id: "cr_1",
    title: "Adres teyidi",
    category: TicketCategory.Delivery,
    text: "Merhaba, gönderenle iletişime geçip adresi teyit ediyoruz. 5 dakika içinde size dönüyoruz; kurye bu arada bölgede beklesin.",
  },
  {
    id: "cr_2",
    title: "Ödeme sorgulanıyor",
    category: TicketCategory.Payment,
    text: "Merhaba, ödemeyi sağlayıcının kayıtlarından sorguluyoruz. Ödeme alındıysa sipariş birkaç dakika içinde panelinize düşer; size ayrıca haber vereceğiz.",
  },
  {
    id: "cr_3",
    title: "Kısmi iade",
    category: TicketCategory.Payment,
    text: "Sipariş detayında \"İade başlat\" ile iade edilecek tutarı girebilirsiniz. İade toplamı ödenen tutarı aşamaz; her iade ayrı kaydedilir.",
  },
  {
    id: "cr_4",
    title: "Teslimat bölgesi ekleme",
    category: TicketCategory.Account,
    text: "Ayarlar, Teslimat bölgeleri bölümünden ilçeyi seçip teslim ettiğiniz mahalleleri ve ücreti girebilirsiniz.",
  },
];

/** Ekip notları; gün, taban güne göre. */
export const noteSeeds = [
  { id: "sn_1", shopId: "shop_nergis", authorName: "Selin K.", dayOffset: -19, text: "14 Şubat için kapasiteyi aralık başına 25'e çıkarmak istiyorlar. Ocak'ta hatırlat." },
  { id: "sn_2", shopId: "shop_nergis", authorName: "Mert A.", dayOffset: -40, text: "Instagram linkini bio'ya biz ekledik. Sahibi teknik konularda telefonla konuşmayı tercih ediyor." },
];

/** Dükkânların destek panelindeki özet bilgileri. */
export const shopFacts: Record<string, { since: string; monthlyOrders: number; paymentAccount: string; smsUsed: number; smsLimit: number }> = {
  shop_nergis: { since: "2025-08-04", monthlyOrders: 312, paymentAccount: "iyzico, onaylı", smsUsed: 286, smsLimit: 500 },
  shop_lale: { since: "2025-09-12", monthlyOrders: 188, paymentAccount: "iyzico, onaylı", smsUsed: 140, smsLimit: 100 },
  shop_papatya: { since: "2026-01-20", monthlyOrders: 64, paymentAccount: "PayTR, onay bekliyor", smsUsed: 22, smsLimit: 100 },
  shop_begonvil: { since: "2026-03-02", monthlyOrders: 97, paymentAccount: "iyzico, onaylı", smsUsed: 81, smsLimit: 100 },
  shop_orkide: { since: "2025-11-15", monthlyOrders: 0, paymentAccount: "iyzico, onaylı", smsUsed: 0, smsLimit: 100 },
};
