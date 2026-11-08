import type { Metadata } from "next";
import { Suspense } from "react";
import { getPanelSettings } from "@/lib/api";
import { Permission, shopCan } from "@/lib/permissions";
import panel from "../_components/panel.module.css";
import { panelSession } from "../_lib";
import { AppearanceForm } from "./AppearanceForm";

export const metadata: Metadata = { title: "Dükkânınızın görünümü" };

export default function AppearancePage() {
  return (
    <Suspense>
      <Appearance />
    </Suspense>
  );
}

async function Appearance() {
  const { shop, user } = await panelSession();
  const settings = await getPanelSettings(shop.id);
  return (
    <>
      <header className={panel.pageHead}>
        <div className={panel.pageHeadText}>
          <span className={panel.eyebrow}>Ayarlar</span>
          <h1 className={panel.pageTitle}>Dükkânınızın görünümü</h1>
        </div>
      </header>
      <AppearanceForm shop={settings.profile.shop} readOnly={!shopCan(user.role, Permission.CatalogEdit)} />
    </>
  );
}
