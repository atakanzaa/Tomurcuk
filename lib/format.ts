// Biçim kuralları design/tomurcuk/README.md "Biçimler" bölümünden:
// para "1.250 TL", saat "14:30", aralık "13:00–16:00", telefon "0532 412 88 19".
import type { ClockTime, IsoDate, Kurus } from "@/lib/api/types";

const wholeLira = new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 0 });
const withKurus = new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Tutarın TL kısmı: 125000 → "1.250", 72050 → "720,50" */
function formatAmount(amount: Kurus): string {
  return (amount % 100 === 0 ? wholeLira : withKurus).format(amount / 100);
}

/** 125000 → "1.250 TL" */
export function formatPrice(amount: Kurus): string {
  return `${formatAmount(amount)} TL`;
}

/** Seçenekli ürünlerde en düşük fiyat: 85000 → "850 TL'den" */
export function formatPriceFrom(amount: Kurus): string {
  return `${formatPrice(amount)}'den`;
}

/** "13:00", "16:00" → "13:00–16:00" */
export function formatTimeRange(start: ClockTime, end: ClockTime): string {
  return `${start}–${end}`;
}

/** Panel satırındaki kısa aralık: "13:00", "16:00" → "13–16" */
export function formatShortTimeRange(start: ClockTime, end: ClockTime): string {
  const short = (time: ClockTime) => (time.endsWith(":00") ? String(Number(time.slice(0, 2))) : time);
  return `${short(start)}–${short(end)}`;
}

/** "0216 338 00 00" → "tel:+902163380000" */
export function phoneHref(phone: string): string {
  return `tel:+90${phone.replace(/\D/g, "").replace(/^0/, "")}`;
}

/** "0216 338 00 00" → "https://wa.me/902163380000" */
export function whatsappHref(phone: string): string {
  return `https://wa.me/90${phone.replace(/\D/g, "").replace(/^0/, "")}`;
}

export interface ZonedNow {
  date: IsoDate;
  time: ClockTime;
}

/**
 * Bir anın dükkânın saat dilimindeki tarih ve saati. "Bugün" ve son sipariş saati
 * hesapları sunucunun saat dilimine değil buna göre yapılır.
 */
export function zonedNow(instant: Date, timeZone: string): ZonedNow {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(instant);
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value ?? "";
  return { date: `${get("year")}-${get("month")}-${get("day")}`, time: `${get("hour")}:${get("minute")}` };
}

/** 6000, 12000 → "60–120 TL"; eşitse "60 TL" */
export function formatPriceRange(min: Kurus, max: Kurus): string {
  return min === max ? formatPrice(min) : `${formatAmount(min)}–${formatPrice(max)}`;
}

// Saatin okunuşundaki son kelime: 15:00 → "beş", 14:30 → "otuz".
const ONES = ["", "bir", "iki", "üç", "dört", "beş", "altı", "yedi", "sekiz", "dokuz"];
const TENS = ["sıfır", "on", "yirmi", "otuz", "kırk", "elli"];

function lastSpokenWord(value: number): string {
  return value % 10 ? ONES[value % 10] : TENS[value / 10];
}

const BACK_VOWELS = "aıou";
const VOWELS = "aeıioöuü";
const VOICELESS = "çfhkpsşt";

/**
 * Saate Türkçe hâl eki ekler: yönelme ("15:00'e", "16:00'ya") ya da bulunma
 * ("15:00'te", "16:00'da"). Ek, saatin okunuşundaki son kelimeye uyar.
 */
export function withTimeSuffix(time: ClockTime, grammaticalCase: "dative" | "locative"): string {
  const [hour, minute] = time.split(":").map(Number);
  const word = lastSpokenWord(minute ? minute : hour);
  const lastVowel = [...word].reverse().find((ch) => VOWELS.includes(ch)) ?? "e";
  const back = BACK_VOWELS.includes(lastVowel);
  const lastChar = word.at(-1) ?? "";
  if (grammaticalCase === "dative") {
    const buffer = VOWELS.includes(lastChar) ? "y" : "";
    return `${time}'${buffer}${back ? "a" : "e"}`;
  }
  const consonant = VOICELESS.includes(lastChar) ? "t" : "d";
  return `${time}'${consonant}${back ? "a" : "e"}`;
}
