// Takvim günleri "YYYY-MM-DD" olarak taşınır ve saat diliminden bağımsız hesaplanır;
// "bugün"ün hangi gün olduğu ise her zaman dükkânın saat dilimine göre bulunur (zonedNow).
import type { IsoDate } from "@/lib/api/types";

const toUtcDate = (date: IsoDate) => new Date(`${date}T12:00:00Z`);

export function addDays(date: IsoDate, days: number): IsoDate {
  const d = toUtcDate(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function daysBetween(from: IsoDate, to: IsoDate): number {
  return Math.round((toUtcDate(to).getTime() - toUtcDate(from).getTime()) / 86_400_000);
}

const dayMonth = new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "long", timeZone: "UTC" });
const weekday = new Intl.DateTimeFormat("tr-TR", { weekday: "long", timeZone: "UTC" });

/** "22 Ekim" */
export const formatDayMonth = (date: IsoDate) => dayMonth.format(toUtcDate(date));

/** "Cuma" */
export const formatWeekday = (date: IsoDate) => weekday.format(toUtcDate(date));

/** "14 Şubat Cumartesi" */
export const formatLongDate = (date: IsoDate) => `${formatDayMonth(date)} ${formatWeekday(date)}`;

/** "Bugün", "Yarın" ya da gün adı. */
export function relativeDayName(date: IsoDate, today: IsoDate): string {
  const diff = daysBetween(today, date);
  if (diff === 0) return "Bugün";
  if (diff === 1) return "Yarın";
  return formatWeekday(date);
}

/** Bugün ve yarın için "Yarın, 22 Ekim"; diğer günlerde "23 Ekim Cuma". */
export function formatDeliveryDay(date: IsoDate, today: IsoDate): string {
  const diff = daysBetween(today, date);
  return diff === 0 || diff === 1 ? `${relativeDayName(date, today)}, ${formatDayMonth(date)}` : formatLongDate(date);
}
