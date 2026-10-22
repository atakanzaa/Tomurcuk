import type { Metadata } from "next";
import { Suspense } from "react";
import { getDeliveryZones, getTimeSlots } from "@/lib/api";
import { formatPrice, formatTimeRange } from "@/lib/format";
import panel from "../_components/panel.module.css";
import styles from "../_components/simple.module.css";
import { panelSession } from "../_lib";

export const metadata: Metadata = { title: "Teslimat ayarları" };

export default function DeliverySettingsPage() {
  return (
    <Suspense>
      <DeliverySettings />
    </Suspense>
  );
}

async function DeliverySettings() {
  const { shop } = await panelSession();
  const [zones, slots] = await Promise.all([getDeliveryZones(shop.id), getTimeSlots(shop.id)]);
  const districts = [...new Set(zones.map((z) => z.district))];
  return (
    <>
      <header className={panel.pageHead}>
        <div className={panel.pageHeadText}>
          <span className={panel.eyebrow}>Ayarlar</span>
          <h1 className={panel.pageTitle}>Teslimat</h1>
        </div>
      </header>
      <div className={panel.section}>
        <h2 className={styles.title}>Aynı gün teslim</h2>
        <p className={styles.muted}>Bugün teslim için son sipariş saati {shop.sameDayCutoff}. Bu saatten sonra gelen siparişler ertesi güne yazılır.</p>

        <h2 className={styles.title}>Saat aralıkları</h2>
        <ul className={styles.list}>
          {slots.map((s) => (
            <li key={s.id} className={styles.row}>
              <span className={styles.strong}>{formatTimeRange(s.start, s.end)}</span>
              <span className={styles.muted}>Aralık başına en çok {s.capacity} sipariş</span>
            </li>
          ))}
        </ul>

        <h2 className={styles.title}>Teslim bölgeleri</h2>
        {districts.map((district) => (
          <ul key={district} className={styles.list}>
            {zones
              .filter((z) => z.district === district)
              .map((z) => (
                <li key={z.id} className={styles.row}>
                  <span className={styles.rowText}>
                    <span className={styles.strong}>{z.neighborhood ?? `${district}, tüm mahalleler`}</span>
                    {z.neighborhood && <span className={styles.muted}>{district}</span>}
                  </span>
                  <span className={styles.side}>{formatPrice(z.fee)}</span>
                </li>
              ))}
          </ul>
        ))}

        <h2 className={styles.title}>Kapalı günler</h2>
        <p className={styles.muted}>Kapalı gün yok. Tatil eklediğinizde o güne sipariş alınmaz; o güne verilmiş siparişler size gösterilir.</p>
      </div>
    </>
  );
}
