// Destek talebi etiketleri ve zaman hesapları (iki panelde de kullanılır).
import { TicketCategory, TicketPriority, TicketStatus, type TicketSummary } from "@/lib/api/types";
import type { StatusTone } from "@/components/ui/StatusTag";

export const ticketCategoryLabel: Record<TicketCategory, string> = {
  [TicketCategory.Payment]: "Ödeme",
  [TicketCategory.Delivery]: "Teslimat",
  [TicketCategory.Technical]: "Teknik",
  [TicketCategory.Account]: "Hesap",
};

/** Destek talebi durumları sipariş durumlarıyla aynı renkleri kullanır. */
export const ticketStatusTag: Record<TicketStatus, { tone: StatusTone; label: string }> = {
  [TicketStatus.Open]: { tone: "new", label: "Açık" },
  [TicketStatus.WaitingShop]: { tone: "preparing", label: "Dükkân bekleniyor" },
  [TicketStatus.Resolved]: { tone: "delivered", label: "Çözüldü" },
};

/** İlk yanıt hedefi: acil 15 dakika, normal 4 saat. */
export const FIRST_RESPONSE_MINUTES: Record<TicketPriority, number> = {
  [TicketPriority.Urgent]: 15,
  [TicketPriority.Normal]: 240,
};

/** "6 dk", "1 sa 40 dk", "dün" */
export function durationText(minutes: number): string {
  if (minutes < 60) return `${Math.max(1, minutes)} dk`;
  if (minutes < 24 * 60) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m ? `${h} sa ${m} dk` : `${h} sa`;
  }
  return minutes < 48 * 60 ? "dün" : `${Math.floor(minutes / (24 * 60))} gün`;
}

/** Bir andan bu yana geçen dakika; saat yalnızca istek anında okunur. */
export const minutesSince = (iso: string, now: number = Date.now()) => Math.round((now - Date.parse(iso)) / 60_000);

/** İlk yanıt için kalan ya da aşılan süre; yanıt verildiyse null. */
export function firstResponseState(ticket: TicketSummary, now: number = Date.now()): { overdue: boolean; minutes: number } | null {
  if (ticket.firstResponseAt || ticket.status === TicketStatus.Resolved) return null;
  const left = FIRST_RESPONSE_MINUTES[ticket.priority] - minutesSince(ticket.createdAt, now);
  return { overdue: left < 0, minutes: Math.abs(left) };
}
