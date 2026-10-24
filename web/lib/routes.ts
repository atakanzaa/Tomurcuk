/** Kök düzeyde dükkân slug'ı olamayacak bölümler. Proxy bunlara dokunmaz. */
const RESERVED_SEGMENTS = new Set([
  "_next",
  "api",
  "panel",
  "destek",
  "bilesenler",
  "giris",
  "cicekciler",
  "foto",
  "gizlilik",
  "kullanim-kosullari",
  "sifre",
  "sifremi-unuttum",
]);

/** Satıcı panelinin giriş sayfası. */
export const LOGIN_PATH = "/giris";

/** Tarayıcıdaki panel oturumu cookie'si (lib/panel/cookie.ts). */
export const PANEL_SESSION_COOKIE = "tomurcuk_oturum";

/** Destek panelinin giriş sayfası ve oturum cookie'si. */
export const SUPPORT_LOGIN_PATH = "/destek/giris";
export const SUPPORT_HOME_PATH = "/destek/dukkanlar";
export const SUPPORT_SESSION_COOKIE = "tomurcuk_destek";

/** Destek ekibinin dükkân adına açtığı oturumun kimliği; destek panelinden yazılır. */
export const IMPERSONATION_COOKIE = "tomurcuk_destek_oturumu";

export function isReservedSegment(segment: string): boolean {
  // Nokta içeren bölümler dosyadır (favicon.ico, robots.txt).
  return RESERVED_SEGMENTS.has(segment) || segment.includes(".");
}

/**
 * Derlemede vitrin rotalarının kabuğunu doğrulamak için kullanılan sahte slug. Image bir kez
 * build edilip her ortamda çalıştığı için gerçek dükkân verisi derlemede sayfaya gömülmez;
 * dükkân sayfaları ilk ziyarette üretilip önbelleğe alınır.
 */
export const SHELL_SLUG = "__kabuk";
export const SHELL_PRODUCT_ID = "__kabuk";

export const shopPath = (slug: string) => `/${slug}`;
export const productPath = (slug: string, productId: string) => `/${slug}/urun/${productId}`;
export const trackingPath = (slug: string) => `/${slug}/takip`;
export const trackingOrderPath = (slug: string, token: string) => `/${slug}/takip/${token}`;

export const CheckoutStep = {
  Delivery: "teslimat",
  Card: "kart-notu",
  Payment: "odeme",
} as const;
export type CheckoutStep = (typeof CheckoutStep)[keyof typeof CheckoutStep];

export const checkoutPath = (slug: string, step: CheckoutStep) => `/${slug}/siparis/${step}`;

/** Ödeme sayfasından başarısız dönüşte ödeme adımına eklenen parametre. */
export const PAYMENT_FAILED_PARAM = "odeme-basarisiz";
