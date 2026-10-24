import type { Metadata } from "next";
import { Suspense, type ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";
import { getPilotApplications, getShopSummaries, getSupportUser, getTickets } from "@/lib/api";
import { TicketStatus } from "@/lib/api/types";
import { supportLogout } from "@/lib/auth/actions";
import { supportRoleLabel } from "@/lib/permissions";
import { SupportNav } from "./_components/SupportNav";
import styles from "./_components/support.module.css";

export const metadata: Metadata = {
  title: { default: "Destek · Tomurcuk", template: "%s · Destek" },
  robots: { index: false, follow: false },
};

/** Destek paneli; e-posta, şifre ve iki adımlı doğrulamayla girilir (/destek/giris). */
export default function SupportLayout({ children }: LayoutProps<"/destek">) {
  return (
    <Suspense>
      <SupportFrame>{children}</SupportFrame>
    </Suspense>
  );
}

async function SupportFrame({ children }: { children: ReactNode }) {
  const [user, tickets, shops, applications] = await Promise.all([
    getSupportUser(),
    getTickets(),
    getShopSummaries(),
    getPilotApplications(),
  ]);
  const initials = user.name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2);
  return (
    <>
      <header className={styles.topbar}>
        <Logo href="/destek" note="Destek" className={styles.brand} />
        <form action="/destek/ara" role="search" className={styles.search}>
          <label>
            <span className="visually-hidden">Ara</span>
            <input className="tm-field__control" type="search" name="q" placeholder="Sipariş no, telefon, dükkân veya alıcı adı" />
          </label>
        </form>
        <div className={styles.user}>
          <div className={styles.userText}>
            <span className={styles.userName}>{user.name}</span>
            <span className={styles.userRole}>{supportRoleLabel[user.role]}</span>
          </div>
          <span className={styles.avatar} aria-hidden="true">
            {initials}
          </span>
          <form action={supportLogout}>
            <Button type="submit" variant="quiet" size="s">
              Çıkış yap
            </Button>
          </form>
        </div>
      </header>
      <div className={styles.frame}>
        <SupportNav counts={{
            tickets: tickets.filter((t) => t.status !== TicketStatus.Resolved).length,
            shops: shops.length,
            applications: applications.filter((a) => !a.shopId).length,
          }} />
        <main className={styles.main}>{children}</main>
      </div>
    </>
  );
}
