// Yorumların biçimleri. Puan ondalığı virgülle: "4,8".
import type { Rating } from "@/lib/api/types";
import { formatDayMonth } from "@/lib/dates";
import { zonedNow } from "@/lib/format";

export const REVIEW_TEXT_MAX = 500;

/** Yazıldığı yer Türkiye; tarih İstanbul saatiyle. */
const REVIEW_TIME_ZONE = "Europe/Istanbul";

/** 4.8 → "4,8"; 5 → "5,0". */
export function formatRating(average: number): string {
  return average.toFixed(1).replace(".", ",");
}

/** "18 Ekim" */
export function formatReviewDate(createdAt: string): string {
  return formatDayMonth(zonedNow(new Date(createdAt), REVIEW_TIME_ZONE).date);
}

/** "31 yorum" */
export function reviewCountLabel(rating: Rating): string {
  return `${rating.count} yorum`;
}

/** Puan için kelime: formdaki seçimin altında. */
export const ratingWords = ["", "Beğenmedim", "Fena değil", "İyi", "Çok iyi", "Harika"] as const;
