import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { getPilotApplications, getSupportUser } from "@/lib/api";
import { formatDayMonth, relativeDayName } from "@/lib/dates";
import { zonedNow } from "@/lib/format";
import { Permission, supportCan } from "@/lib/permissions";
import styles from "../_components/support.module.css";

export const metadata: Metadata = { title: "Başvurular" };

export default function ApplicationsPage() {
  return (
    <Suspense>
      <Applications />
    </Suspense>
  );
}

async function Applications() {
  const [applications, user] = await Promise.all([getPilotApplications(), getSupportUser()]);
  const canOpen = supportCan(user.role, Permission.ShopOnboard);
  const today = zonedNow(new Date(), "Europe/Istanbul").date;
  const day = (iso: string) => {
    const date = zonedNow(new Date(iso), "Europe/Istanbul").date;
    const name = relativeDayName(date, today);
    return name === "Bugün" || name === "Dün" ? name : formatDayMonth(date);
  };
  const open = applications.filter((a) => !a.shopId).length;
  return (
    <>
      <div className={styles.pageHead}>
        <h1 className={styles.title}>Başvurular</h1>
        <span className={styles.muted}>
          {applications.length} başvuru, {open} bekliyor
        </span>
      </div>
      {applications.length === 0 ? (
        <p className={styles.empty}>Henüz başvuru yok. Başvurular tanıtım sitesindeki formdan gelir.</p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Dükkân</th>
                <th>Telefon</th>
                <th>İlçe</th>
                <th>Instagram</th>
                <th>Geldi</th>
                <th>Durum</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((a) => (
                <tr key={a.id}>
                  <td>{a.shopName}</td>
                  <td className={styles.nowrap}>{a.phone}</td>
                  <td>{a.district}</td>
                  <td>{a.instagram ?? ""}</td>
                  <td className={styles.nowrap}>{day(a.createdAt)}</td>
                  <td className={styles.nowrap}>
                    {a.shopId ? (
                      <Link href={`/destek/dukkanlar/${a.shopId}`}>Dükkân açıldı</Link>
                    ) : canOpen ? (
                      <Link href={`/destek/dukkanlar/yeni?basvuru=${a.id}`}>Dükkân aç</Link>
                    ) : (
                      <span className={styles.muted}>Bekliyor</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
