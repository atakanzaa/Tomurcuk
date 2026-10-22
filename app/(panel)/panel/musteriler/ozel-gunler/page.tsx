import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Button } from "@/components/ui/Button";
import { KraftBand } from "@/components/ui/KraftBand";
import { getCustomers, getReminders } from "@/lib/api";
import { formatDayMonth, formatWeekday } from "@/lib/dates";
import { formatPrice, phoneHref } from "@/lib/format";
import { reminderMessage } from "@/lib/reminders";
import panel from "../../_components/panel.module.css";
import { panelSession } from "../../_lib";
import { CustomerTabs } from "../CustomerTabs";
import styles from "../customers.module.css";
import { ReminderComposer } from "./ReminderComposer";

export const metadata: Metadata = { title: "Özel günler" };

export default function SpecialDaysPage() {
  return (
    <Suspense>
      <SpecialDays />
    </Suspense>
  );
}

async function SpecialDays() {
  const { shop } = await panelSession();
  const [reminders, customers] = await Promise.all([getReminders(shop.id, 7), getCustomers(shop.id)]);
  const days = [...new Set(reminders.map((r) => r.date))];
  const lastYearTotal = reminders.reduce((sum, r) => sum + (r.lastYear?.total ?? 0), 0);
  const people = new Set(reminders.map((r) => r.customer.id)).size;

  return (
    <>
      <header className={panel.pageHead}>
        <div className={panel.pageHeadText}>
          <span className={panel.eyebrow}>Müşteriler</span>
          <h1 className={panel.pageTitle}>Özel günler</h1>
        </div>
      </header>
      <CustomerTabs current="days" customerCount={customers.length} reminderCount={reminders.length} />
      {reminders.length > 0 && (
        <div className={panel.section}>
          <KraftBand tone="peony">
            Önümüzdeki 7 günde <strong>{people} müşterinizin</strong> özel günü var.
            {lastYearTotal > 0 && ` Geçen yıl bu günlerde ${formatPrice(lastYearTotal)} sipariş gelmişti.`}
          </KraftBand>
        </div>
      )}
      <section className={panel.section} aria-label="Önümüzdeki özel günler">
        {reminders.length === 0 && <p className={panel.empty}>Önümüzdeki 7 günde özel gün yok.</p>}
        {days.map((date, dayIndex) => (
          <div key={date}>
            <h2 className={styles.dayTitle}>
              {formatWeekday(date)}, {formatDayMonth(date)}
            </h2>
            {reminders
              .filter((r) => r.date === date)
              .map((reminder, i) => (
                <div key={reminder.specialDay.id} className={styles.reminder}>
                  <div className={styles.reminderTop}>
                    <div className={styles.reminderText}>
                      <Link href={`/panel/musteriler/${reminder.customer.id}`} className={styles.who}>
                        {reminder.customer.name}
                      </Link>
                      <span className={styles.what}>{reminder.specialDay.title}</span>
                      <span className={styles.muted}>
                        {reminder.customer.marketingConsent
                          ? reminder.lastYear
                            ? `Geçen yıl: ${reminder.lastYear.productName}, ${formatPrice(reminder.lastYear.total)}`
                            : "Geçen yıl bu günde sipariş yoktu."
                          : "Mesaj izni yok. Ararsanız hatırlatabilirsiniz."}
                      </span>
                    </div>
                    {reminder.customer.marketingConsent ? (
                      <ReminderComposer
                        phone={reminder.customer.phone}
                        initialMessage={reminderMessage(reminder, shop)}
                        defaultOpen={dayIndex === 0 && i === 0}
                      />
                    ) : (
                      <Button variant="secondary" size="s" href={phoneHref(reminder.customer.phone)}>
                        Ara
                      </Button>
                    )}
                  </div>
                </div>
              ))}
          </div>
        ))}
      </section>
    </>
  );
}
