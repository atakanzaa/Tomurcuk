import type { Area, IsoDate } from "@/lib/api/types";

/** Alıcı ana sayfasının adres parametreleri: `/?semt=Kadıköy|Caferağa&gun=2026-10-23`. */
export const SEARCH_PARAMS = { area: "semt", day: "gun", date: "tarih" } as const;

/** Gün seçiminde takvimi açan seçenek. */
export const OTHER_DAY = "baska";

/** Semt adreste "ilçe|mahalle" olarak taşınır; ilçenin tamamında mahalle boştur. */
export const areaValue = (area: Area) => `${area.district}|${area.neighborhood ?? ""}`;

export function parseArea(value: string | undefined): Area | null {
  if (!value) return null;
  const [district, neighborhood = ""] = value.split("|");
  if (!district) return null;
  return { district, neighborhood: neighborhood || null };
}

/** "Caferağa, Kadıköy"; ilçenin tamamında yalnızca ilçe. */
export const areaLabel = (area: Area) => (area.neighborhood ? `${area.neighborhood}, ${area.district}` : area.district);

/** Seçilen gün: hazır seçeneklerden biri ya da takvimden bir tarih. Geçersizse null. */
export function parseDay(day: string | undefined, date: string | undefined): IsoDate | null {
  const value = day === OTHER_DAY ? date : day;
  return value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;
}
