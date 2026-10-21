import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { searchSupport } from "@/lib/api";
import { zonedNow } from "@/lib/format";
import { OrderTable } from "../_components/OrderTable";
import { TicketTable } from "../_components/TicketTable";
import styles from "../_components/support.module.css";

export const metadata: Metadata = { title: "Arama" };

export default function SearchPage({ searchParams }: PageProps<"/destek/ara">) {
  return (
    <Suspense>
      <Search searchParams={searchParams} />
    </Suspense>
  );
}

async function Search({ searchParams }: Pick<PageProps<"/destek/ara">, "searchParams">) {
  const query = await searchParams;
  const q = typeof query.q === "string" ? query.q.trim() : "";
  const today = zonedNow(new Date(), "Europe/Istanbul").date;
  if (q.length < 2) {
    return (
      <div className={styles.pageHead}>
        <h1 className={styles.title}>Arama</h1>
        <span className={styles.muted}>Sipariş no, telefon, dükkân ya da alıcı adından en az iki karakter yazın.</span>
      </div>
    );
  }
  // Arama da bir destek erişimidir; backend denetim kaydına yazar.
  const results = await searchSupport(q);
  const total = results.orders.length + results.shops.length + results.tickets.length;
  return (
    <>
      <div className={styles.pageHead}>
        <h1 className={styles.title}>&ldquo;{q}&rdquo;</h1>
        <span className={styles.muted}>{total ? `${total} sonuç` : "Sonuç yok. Numarayı ya da adı kontrol edin."}</span>
      </div>
      {results.shops.length > 0 && (
        <section>
          <h2 className={styles.h2}>Dükkânlar</h2>
          <ul className={styles.plainList}>
            {results.shops.map((s) => (
              <li key={s.shop.id}>
                <Link href={`/destek/dukkanlar/${s.shop.id}`} className={styles.subject}>
                  {s.shop.name}
                </Link>
                <span className={styles.sub}>{s.district}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
      {results.orders.length > 0 && (
        <section>
          <h2 className={styles.h2}>Siparişler</h2>
          <OrderTable orders={results.orders} today={today} />
        </section>
      )}
      {results.tickets.length > 0 && (
        <section>
          <h2 className={styles.h2}>Talepler</h2>
          <TicketTable tickets={results.tickets} today={today} />
        </section>
      )}
    </>
  );
}
