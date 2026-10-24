import type { Metadata } from "next";
import { Suspense } from "react";
import { getPanelProducts, getPanelSettings } from "@/lib/api";
import { Permission, shopCan } from "@/lib/permissions";
import panel from "../_components/panel.module.css";
import { panelSession } from "../_lib";
import { ProfileForm } from "./ProfileForm";

export const metadata: Metadata = { title: "Dükkân ayarları" };

export default function ShopSettingsPage() {
  return (
    <Suspense>
      <ShopSettings />
    </Suspense>
  );
}

async function ShopSettings() {
  const { shop, user } = await panelSession();
  const [settings, products] = await Promise.all([getPanelSettings(shop.id), getPanelProducts(shop.id)]);
  return (
    <>
      <header className={panel.pageHead}>
        <div className={panel.pageHeadText}>
          <span className={panel.eyebrow}>Ayarlar</span>
          <h1 className={panel.pageTitle}>Dükkân</h1>
        </div>
      </header>
      <ProfileForm
        profile={settings.profile}
        products={products.filter((p) => p.product.active).map((p) => ({ id: p.product.id, name: p.product.name }))}
        readOnly={!shopCan(user.role, Permission.CatalogEdit)}
      />
    </>
  );
}
