import type { Metadata } from "next";
import { Suspense } from "react";
import { getIstanbulPlaces, getPanelSettings } from "@/lib/api";
import { zonedNow } from "@/lib/format";
import { Permission, shopCan } from "@/lib/permissions";
import panel from "../_components/panel.module.css";
import styles from "../_components/settings.module.css";
import { panelSession } from "../_lib";
import { ClosedDaysForm, CutoffForm, SlotsForm, ZonesForm } from "./DeliveryForms";

export const metadata: Metadata = { title: "Teslimat ayarları" };

export default function DeliverySettingsPage() {
  return (
    <Suspense>
      <DeliverySettings />
    </Suspense>
  );
}

async function DeliverySettings() {
  const { shop, user } = await panelSession();
  const [settings, places] = await Promise.all([getPanelSettings(shop.id), getIstanbulPlaces()]);
  const readOnly = !shopCan(user.role, Permission.CatalogEdit);
  const today = zonedNow(new Date(), shop.timeZone).date;
  return (
    <>
      <header className={panel.pageHead}>
        <div className={panel.pageHeadText}>
          <span className={panel.eyebrow}>Ayarlar</span>
          <h1 className={panel.pageTitle}>Teslimat</h1>
        </div>
      </header>
      <div className={styles.page}>
        {readOnly && <p className={styles.readOnly}>Teslimat ayarlarını dükkân sahibi değiştirir.</p>}
        <CutoffForm cutoff={settings.profile.shop.sameDayCutoff} readOnly={readOnly} />
        <SlotsForm slots={settings.slots} readOnly={readOnly} />
        <ZonesForm zones={settings.zones} places={places} readOnly={readOnly} />
        <ClosedDaysForm days={settings.closedDays} today={today} readOnly={readOnly} />
      </div>
    </>
  );
}
