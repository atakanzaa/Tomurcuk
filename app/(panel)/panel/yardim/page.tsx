import type { Metadata } from "next";
import { Suspense } from "react";
import { StatusTag } from "@/components/ui/StatusTag";
import { getShopTickets } from "@/lib/api";
import { durationText, minutesSince, ticketCategoryLabel, ticketStatusTag } from "@/lib/support";
import panel from "../_components/panel.module.css";
import styles from "../_components/simple.module.css";
import { panelSession } from "../_lib";
import { TicketForm } from "./TicketForm";

export const metadata: Metadata = { title: "Yardım ve destek" };

const FAQ = [
  { q: "Teslimat bölgesi nasıl eklenir?", a: "Teslimat ayarlarında ilçeyi ve mahalleleri ücretiyle birlikte ekleyin. Listede olmayan adrese vitrinden sipariş verilemez." },
  { q: "Havaleyle ödenen siparişi nasıl işaretlerim?", a: "Sipariş detayında Diğer işlemler menüsünden \"Ödendi olarak işaretle\"yi seçin." },
  { q: "Alıcı adreste yoksa ne yaparım?", a: "Siparişi \"Teslim edilemedi\" olarak işaretleyin; alıcıya ve gönderene SMS gider. Sonra yeniden yola çıkarabilirsiniz." },
];

export default function HelpPage() {
  return (
    <>
      <header className={panel.pageHead}>
        <div className={panel.pageHeadText}>
          <span className={panel.eyebrow}>Tomurcuk destek ekibi</span>
          <h1 className={panel.pageTitle}>Yardım</h1>
        </div>
      </header>
      <div className={panel.section}>
        <h2 className={styles.title}>Talep açın</h2>
        <TicketForm />
        <Suspense>
          <MyTickets />
        </Suspense>
        <h2 className={styles.title}>Sık sorulanlar</h2>
        {FAQ.map((item) => (
          <div key={item.q} className={styles.qa}>
            <h3>{item.q}</h3>
            <p>{item.a}</p>
          </div>
        ))}
      </div>
    </>
  );
}

async function MyTickets() {
  const { shop } = await panelSession();
  const tickets = await getShopTickets(shop.id);
  if (!tickets.length) return null;
  return (
    <>
      <h2 className={styles.title}>Talepleriniz</h2>
      <ul className={styles.list}>
        {tickets.map((t) => (
          <li key={t.id} className={styles.row}>
            <span className={styles.rowText}>
              <span className={styles.strong}>{t.subject}</span>
              <span className={styles.muted}>
                {ticketCategoryLabel[t.category]}
                {t.orderNumber && `, ${t.orderNumber}`}, {durationText(minutesSince(t.createdAt))} önce
              </span>
            </span>
            <StatusTag tone={ticketStatusTag[t.status].tone}>{ticketStatusTag[t.status].label}</StatusTag>
          </li>
        ))}
      </ul>
    </>
  );
}
