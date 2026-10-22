// Hatırlatma mesajı: çiçekçi WhatsApp'ta gönderir (MVP'de otomatik gönderim yok).
import type { Reminder, Shop } from "@/lib/api/types";
import { formatDayMonth } from "@/lib/dates";
import { withDativeSuffix, withLocativeSuffix } from "@/lib/format";

export function reminderMessage(reminder: Reminder, shop: Shop): string {
  const name = reminder.customer.name.split(" ")[0];
  const day = formatDayMonth(reminder.date);
  const last = reminder.lastYear;
  const body = last
    ? `geçen yıl ${withLocativeSuffix(day)} ${last.productName.toLocaleLowerCase("tr")} göndermiştiniz. Bu yıl da hazırlayalım mı?`
    : `${withDativeSuffix(day)} çiçek hazırlayalım mı?`;
  return `Merhaba ${name}, ${body} ${shop.name}`;
}

/** wa.me bağlantısı, mesaj hazır yazılmış olarak. */
export function whatsappMessageHref(phone: string, message: string): string {
  return `https://wa.me/90${phone.replace(/\D/g, "").replace(/^0/, "")}?text=${encodeURIComponent(message)}`;
}
