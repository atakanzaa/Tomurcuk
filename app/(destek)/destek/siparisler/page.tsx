import type { Metadata } from "next";
import { Suspense } from "react";
import { getSupportOrders } from "@/lib/api";
import { zonedNow } from "@/lib/format";
import { OrderTable } from "../_components/OrderTable";
import styles from "../_components/support.module.css";

export const metadata: Metadata = { title: "Siparişler" };

export default function SupportOrdersPage({ searchParams }: PageProps<"/destek/siparisler">) {
  return (
    <Suspense>
      <Orders searchParams={searchParams} />
    </Suspense>
  );
}

async function Orders({ searchParams }: Pick<PageProps<"/destek/siparisler">, "searchParams">) {
  const [orders, query] = await Promise.all([getSupportOrders(), searchParams]);
  const text = typeof query.ara === "string" ? query.ara.trim() : "";
  const needle = text.toLocaleLowerCase("tr");
  const visible = needle
    ? orders.filter((o) => [o.number, o.shopName, o.recipientName].some((v) => v.toLocaleLowerCase("tr").includes(needle)))
    : orders;
  return (
    <>
      <div className={styles.pageHead}>
        <h1 className={styles.title}>Siparişler</h1>
        <span className={styles.muted}>Bugün ve sonrası, ayrıca tamamlanmamış olanlar. Telefonlar maskeli.</span>
      </div>
      <form role="search" className={styles.search}>
        <label>
          <span className="visually-hidden">Siparişlerde ara</span>
          <input className="tm-field__control" type="search" name="ara" defaultValue={text} placeholder="Sipariş no, dükkân ya da alıcı" />
        </label>
      </form>
      <OrderTable orders={visible} today={zonedNow(new Date(), "Europe/Istanbul").date} />
    </>
  );
}
