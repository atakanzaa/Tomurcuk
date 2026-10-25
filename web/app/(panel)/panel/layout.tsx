import type { Metadata } from "next";
import { Suspense, type ReactNode } from "react";
import { ImpersonationBand } from "./_components/ImpersonationBand";
import { NewOrderWatcher } from "./_components/NewOrderWatcher";
import { PanelSidebar, PanelTabBar } from "./_components/PanelNav";
import { StatusBand } from "./_components/StatusBand";
import styles from "./_components/panel.module.css";
import { panelCounts, panelSession } from "./_lib";

export const metadata: Metadata = {
  title: { default: "Panel · Tomurcuk", template: "%s · Tomurcuk" },
  robots: { index: false, follow: false },
};

export default function PanelLayout({ children }: LayoutProps<"/panel">) {
  return (
    <Suspense>
      <PanelFrame>{children}</PanelFrame>
    </Suspense>
  );
}

async function PanelFrame({ children }: { children: ReactNode }) {
  const { shop, impersonation, statusReason } = await panelSession();
  const counts = await panelCounts(shop.id, shop.timeZone);
  return (
    <>
      {impersonation && <ImpersonationBand impersonation={impersonation} shopName={shop.name} timeZone={shop.timeZone} />}
      <StatusBand shop={shop} reason={statusReason} />
      <div className={styles.shell}>
        <PanelSidebar
          shopName={shop.name}
          shopShortName={shop.shortName}
          shopSlug={shop.slug}
          todayCount={counts.bugun}
          reminderCount={counts.reminders}
        />
        <main className={styles.main}>{children}</main>
        <PanelTabBar />
      </div>
      <NewOrderWatcher />
    </>
  );
}
