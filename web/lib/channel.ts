import { Channel } from "@/lib/api/types";

// Alıcının vitrine hangi kanaldan geldiği. Önce paylaşım bağlantısındaki `?k=` (panelde
// "Paylaşım bağlantılarınız"), yoksa yönlendiren site, yoksa uygulamanın tarayıcısı. Kişi,
// IP ya da tarayıcı bilgisi saklanmaz; kanal tarayıcı oturumunda durur ve ziyaret oturum
// başına bir kez sayılır. Siparişe ilk geliş kanalı geçer.

/** Paylaşım bağlantısındaki parametre: `tomurcuk.shop/nergis?k=instagram`. */
export const CHANNEL_PARAM = "k";

/** Panelde gösterilen adlar. */
export const channelNames: Record<Channel, string> = {
  [Channel.Instagram]: "Instagram",
  [Channel.WhatsApp]: "WhatsApp",
  [Channel.Google]: "Google",
  [Channel.Facebook]: "Facebook",
  [Channel.Qr]: "QR kod",
  [Channel.Tomurcuk]: "Tomurcuk ana sayfası",
  [Channel.Other]: "Başka siteler",
  [Channel.Direct]: "Doğrudan",
};

/** Sipariş satırında: "Instagram'dan geldi". Doğrudan gelen siparişte yazı yok. */
export const channelArrival: Record<Channel, string | null> = {
  [Channel.Instagram]: "Instagram'dan geldi",
  [Channel.WhatsApp]: "WhatsApp'tan geldi",
  [Channel.Google]: "Google'dan geldi",
  [Channel.Facebook]: "Facebook'tan geldi",
  [Channel.Qr]: "QR koddan geldi",
  [Channel.Tomurcuk]: "Tomurcuk ana sayfasından geldi",
  [Channel.Other]: "Başka bir siteden geldi",
  [Channel.Direct]: null,
};

const codes = new Set<string>(Object.values(Channel));

export const isChannel = (value: unknown): value is Channel => typeof value === "string" && codes.has(value);

/** `?k=` ve `utm_source` için kısaltmalar da kabul edilir. */
const aliases: Record<string, Channel> = {
  instagram: Channel.Instagram,
  ig: Channel.Instagram,
  whatsapp: Channel.WhatsApp,
  wa: Channel.WhatsApp,
  google: Channel.Google,
  maps: Channel.Google,
  facebook: Channel.Facebook,
  fb: Channel.Facebook,
  qr: Channel.Qr,
};

const referrerHosts: [RegExp, Channel][] = [
  [/(^|\.)instagram\.com$/, Channel.Instagram],
  [/(^|\.)(facebook\.com|fb\.com|messenger\.com)$/, Channel.Facebook],
  [/(^|\.)(whatsapp\.com|wa\.me)$/, Channel.WhatsApp],
  [/(^|\.)google\.[a-z.]+$/, Channel.Google],
];

export interface Arrival {
  /** `location.search` */
  search: string;
  /** `document.referrer`; boş olabilir. */
  referrer: string;
  userAgent: string;
  /** Vitrinin kendi adresi (`location.host`). */
  host: string;
  slug: string;
}

export function detectChannel({ search, referrer, userAgent, host, slug }: Arrival): Channel {
  const params = new URLSearchParams(search);
  const tagged = (params.get(CHANNEL_PARAM) ?? params.get("utm_source") ?? "").trim().toLowerCase();
  if (aliases[tagged]) return aliases[tagged];

  const from = parseUrl(referrer);
  if (from) {
    if (from.host === host) {
      // Dükkânın kendi sayfaları kaynak değildir (yeni sekmede açılan ürün gibi).
      const own = from.pathname === `/${slug}` || from.pathname.startsWith(`/${slug}/`);
      if (!own) return Channel.Tomurcuk;
    } else {
      const match = referrerHosts.find(([pattern]) => pattern.test(from.hostname));
      return match ? match[1] : Channel.Other;
    }
  }

  // Uygulama içi tarayıcılar yönlendiren göndermez ama kendini tanıtır.
  if (/Instagram/.test(userAgent)) return Channel.Instagram;
  if (/FBAN|FBAV|FB_IAB/.test(userAgent)) return Channel.Facebook;
  if (/WhatsApp/.test(userAgent)) return Channel.WhatsApp;
  return Channel.Direct;
}

function parseUrl(value: string): URL | null {
  if (!value) return null;
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

const storageKey = (slug: string) => `tomurcuk_kanal:${slug}`;
const countedKey = (slug: string) => `tomurcuk_sayildi:${slug}`;

/**
 * Bu oturumda vitrine ilk gelişin kanalı. İlk çağrıda bulunur ve saklanır; vitrin de ürün
 * formu da aynı değeri görür, hangisi önce çalışırsa çalışsın. Tarayıcıda çağrılır.
 */
export function arrivalChannel(slug: string): Channel {
  const stored = read(storageKey(slug));
  if (isChannel(stored)) return stored;
  const channel = detectChannel({
    search: window.location.search,
    referrer: document.referrer,
    userAgent: navigator.userAgent,
    host: window.location.host,
    slug,
  });
  write(storageKey(slug), channel);
  return channel;
}

/**
 * Ziyaret oturum başına bir kez sayılır: ilk çağrıda true. Depolama kapalıysa (gizli pencere
 * ayarı) her sayfada yeniden sayılmasın diye false.
 */
export function claimVisit(slug: string): boolean {
  if (read(countedKey(slug))) return false;
  return write(countedKey(slug), "1");
}

function read(key: string): string | null {
  try {
    return window.sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string): boolean {
  try {
    window.sessionStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

/** Paylaşım bağlantısı: `https://tomurcuk.shop/nergis?k=instagram`. */
export function shareLink(siteUrl: string, slug: string, channel: Channel): string {
  return `${siteUrl.replace(/\/$/, "")}/${slug}?${CHANNEL_PARAM}=${channel}`;
}
