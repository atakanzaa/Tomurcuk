import type { Metadata } from "next";
import { Suspense } from "react";
import { getAuditLog, getSupportUser } from "@/lib/api";
import { formatDayMonth } from "@/lib/dates";
import { zonedNow } from "@/lib/format";
import { Permission, supportCan } from "@/lib/permissions";
import styles from "../_components/support.module.css";

export const metadata: Metadata = { title: "Denetim kaydı" };

export default function AuditPage() {
  return (
    <Suspense>
      <Audit />
    </Suspense>
  );
}

async function Audit() {
  const [entries, user] = await Promise.all([getAuditLog(), getSupportUser()]);
  // Temsilci yalnızca kendi işlemlerini görür; lider ve sahip hepsini.
  const visible = supportCan(user.role, Permission.AuditViewAll) ? entries : entries.filter((e) => e.actorName === user.name);
  return (
    <>
      <div className={styles.pageHead}>
        <h1 className={styles.title}>Denetim kaydı</h1>
        <span className={styles.muted}>
          {supportCan(user.role, Permission.AuditViewAll) ? "Tüm destek işlemleri." : "Kendi işlemleriniz."} Kayıtlar silinmez ve değiştirilmez.
        </span>
      </div>
      {visible.length === 0 ? (
        <p className={styles.empty}>Henüz kayıt yok.</p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Zaman</th>
                <th>Kişi</th>
                <th>Dükkân</th>
                <th>İşlem</th>
                <th>Kayıt</th>
                <th>Gerekçe</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((e) => {
                const when = zonedNow(new Date(e.at), "Europe/Istanbul");
                return (
                  <tr key={e.id}>
                    <td className={styles.nowrap}>
                      {formatDayMonth(when.date)}, {when.time}
                    </td>
                    <td className={styles.nowrap}>{e.actorName}</td>
                    <td>{e.shopName ?? <span className={styles.small}>—</span>}</td>
                    <td>{e.action}</td>
                    <td>{e.record}</td>
                    <td>{e.reason ?? <span className={styles.small}>—</span>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
