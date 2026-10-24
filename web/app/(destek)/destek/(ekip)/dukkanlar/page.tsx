import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { StatusTag } from "@/components/ui/StatusTag";
import { Button } from "@/components/ui/Button";
import { getShopSummaries, getSupportUser } from "@/lib/api";
import { Permission, supportCan } from "@/lib/permissions";
import { formatDayMonth, relativeDayName } from "@/lib/dates";
import { zonedNow } from "@/lib/format";
import { planLabel } from "@/lib/shop";
import styles from "../_components/support.module.css";

export const metadata: Metadata = { title: "Dükkânlar" };

export default function ShopsPage() {
  return (
    <Suspense>
      <Shops />
    </Suspense>
  );
}

async function Shops() {
  const [shops, user] = await Promise.all([getShopSummaries(), getSupportUser()]);
  const today = zonedNow(new Date(), "Europe/Istanbul").date;
  return (
    <>
      <div className={styles.pageHead}>
        <h1 className={styles.title}>Dükkânlar</h1>
        <span className={styles.muted}>{shops.length} dükkân</span>
        {supportCan(user.role, Permission.ShopOnboard) && (
          <Button size="s" href="/destek/dukkanlar/yeni">
            Dükkân aç
          </Button>
        )}
      </div>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Dükkân</th>
              <th>Paket</th>
              <th>Durum</th>
              <th>Bu ay sipariş</th>
              <th>Açık talep</th>
              <th>Son etkinlik</th>
            </tr>
          </thead>
          <tbody>
            {shops.map((s) => {
              const last = s.lastActivityAt ? zonedNow(new Date(s.lastActivityAt), "Europe/Istanbul") : null;
              const day = last ? relativeDayName(last.date, today) : null;
              return (
                <tr key={s.shop.id}>
                  <td>
                    <Link className={styles.subject} href={`/destek/dukkanlar/${s.shop.id}`}>
                      {s.shop.name}
                    </Link>
                    <span className={styles.sub}>{s.district}</span>
                  </td>
                  <td className={styles.nowrap}>{planLabel[s.shop.plan]}</td>
                  <td>
                    <StatusTag tone={s.shop.active ? "delivered" : "failed"}>{s.shop.active ? "Aktif" : "Askıda"}</StatusTag>
                  </td>
                  <td>{s.monthlyOrders}</td>
                  <td className={s.openTickets ? undefined : styles.small}>{s.openTickets}</td>
                  <td className={styles.nowrap}>
                    {last ? (day === "Bugün" || day === "Dün" ? `${day} ${last.time}` : formatDayMonth(last.date)) : <span className={styles.small}>Kayıt yok</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
