import "server-only";
import { cache } from "react";
import { getOrders, getReminders } from "@/lib/api";
import { addDays } from "@/lib/dates";
import { zonedNow } from "@/lib/format";
import { loadPanel } from "@/lib/panel/session";

/** İstek başına bir kez: panel oturumu (layout ve sayfa aynı sonucu kullanır). */
export const panelSession = cache(loadPanel);

export const DayView = { Today: "bugun", Tomorrow: "yarin", Week: "hafta" } as const;
export type DayView = (typeof DayView)[keyof typeof DayView];

export const dayViewLabel: Record<DayView, string> = {
  [DayView.Today]: "Bugün",
  [DayView.Tomorrow]: "Yarın",
  [DayView.Week]: "Bu hafta",
};

export function parseDayView(value: string | string[] | undefined): DayView {
  const v = Array.isArray(value) ? value[0] : value;
  return Object.values(DayView).find((d) => d === v) ?? DayView.Today;
}

/** Dükkânın saat dilimine göre bugün ve görünümün tarih aralığı. */
export function dayRange(view: DayView, timeZone: string) {
  const now = zonedNow(new Date(), timeZone);
  const today = now.date;
  if (view === DayView.Tomorrow) return { now, today, from: addDays(today, 1), to: addDays(today, 1) };
  if (view === DayView.Week) return { now, today, from: today, to: addDays(today, 6) };
  return { now, today, from: today, to: today };
}

/** Üç sekmenin sipariş sayıları ve menüdeki özel gün sayısı. */
export const panelCounts = cache(async (shopId: string, timeZone: string) => {
  const { today } = dayRange(DayView.Today, timeZone);
  const [week, reminders] = await Promise.all([
    getOrders(shopId, { from: today, to: addDays(today, 6) }),
    getReminders(shopId, 7),
  ]);
  const active = week.filter((o) => o.status !== "cancelled");
  return {
    [DayView.Today]: active.filter((o) => o.deliveryDate === today).length,
    [DayView.Tomorrow]: active.filter((o) => o.deliveryDate === addDays(today, 1)).length,
    [DayView.Week]: active.length,
    reminders: reminders.length,
  };
});
