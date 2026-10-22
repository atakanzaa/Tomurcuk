import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { getCustomers, getReminders } from "@/lib/api";
import { formatDayMonth, relativeDayName } from "@/lib/dates";
import { formatPrice, zonedNow } from "@/lib/format";
import panel from "../_components/panel.module.css";
import { panelSession } from "../_lib";
import { CustomerTabs } from "./CustomerTabs";
import styles from "./customers.module.css";

export const metadata: Metadata = { title: "Müşteriler" };

export default function CustomersPage({ searchParams }: PageProps<"/panel/musteriler">) {
  return (
    <Suspense>
      <Customers searchParams={searchParams} />
    </Suspense>
  );
}

async function Customers({ searchParams }: Pick<PageProps<"/panel/musteriler">, "searchParams">) {
  const [{ shop }, query] = await Promise.all([panelSession(), searchParams]);
  const text = typeof query.ara === "string" ? query.ara.trim() : "";
  const [all, matches, reminders] = await Promise.all([
    getCustomers(shop.id),
    getCustomers(shop.id, { query: text }),
    getReminders(shop.id, 7),
  ]);
  const today = zonedNow(new Date(), shop.timeZone).date;

  return (
    <>
      <header className={panel.pageHead}>
        <div className={panel.pageHeadText}>
          <span className={panel.eyebrow}>Müşteriler</span>
          <h1 className={panel.pageTitle}>Müşteri defteri</h1>
        </div>
      </header>
      <CustomerTabs current="all" customerCount={all.length} reminderCount={reminders.length} />
      <form className={panel.searchForm} role="search">
        <label>
          <span className="visually-hidden">Müşteri ara</span>
          <input className="tm-field__control" type="search" name="ara" defaultValue={text} placeholder="İsim ya da telefon" />
        </label>
        <button type="submit" className="tm-btn tm-btn--secondary">
          Ara
        </button>
      </form>
      <div className={panel.section}>
        {matches.length === 0 ? (
          <p className={panel.empty}>&quot;{text}&quot; ile eşleşen müşteri yok.</p>
        ) : (
          <ul className={styles.list}>
            {matches.map((c) => {
              const last = c.lastOrderAt ? zonedNow(new Date(c.lastOrderAt), shop.timeZone).date : null;
              const lastName = last ? relativeDayName(last, today) : null;
              return (
                <li key={c.id} className={styles.row}>
                  <Link href={`/panel/musteriler/${c.id}`} className={styles.rowLink}>
                    <span className={styles.who}>{c.name}</span>
                    <span className={styles.what}>{c.phone}</span>
                    <span className={styles.muted}>
                      {c.orderCount} sipariş, toplam {formatPrice(c.totalSpent)}
                    </span>
                  </Link>
                  {last && (
                    <span className={styles.side}>
                      Son sipariş
                      <br />
                      {lastName === "Bugün" || lastName === "Dün" ? lastName : formatDayMonth(last)}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
}
