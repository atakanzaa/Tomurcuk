import { CaretRight } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Button } from "@/components/ui/Button";
import { logout } from "@/lib/auth/actions";
import panel from "../_components/panel.module.css";
import styles from "../_components/simple.module.css";
import { panelSession } from "../_lib";

export const metadata: Metadata = { title: "Diğer" };

export default function MorePage() {
  return (
    <>
      <header className={panel.pageHead}>
        <div className={panel.pageHeadText}>
          <h1 className={panel.pageTitle}>Diğer</h1>
        </div>
      </header>
      <nav aria-label="Diğer sayfalar" className={panel.section}>
        {[
          { href: "/panel/urunler", label: "Ürünler" },
          { href: "/panel/yorumlar", label: "Yorumlar" },
          { href: "/panel/teslimat", label: "Teslimat ayarları" },
          { href: "/panel/ayarlar", label: "Dükkân ayarları" },
          {
            href: "/panel/fisler?gun=bugun",
            label: "Bugünün fişlerini yazdır",
          },
          { href: "/panel/yardim", label: "Yardım ve destek" },
        ].map((item) => (
          <Link key={item.href} href={item.href} className={styles.menuLink}>
            {item.label}
            <CaretRight size={20} aria-hidden="true" />
          </Link>
        ))}
        <Suspense>
          <ShopPageLink />
        </Suspense>
      </nav>
      <Suspense>
        <SignedIn />
      </Suspense>
    </>
  );
}

async function SignedIn() {
  const { user, impersonation } = await panelSession();
  if (impersonation) return null;
  return (
    <section aria-label="Oturum" className={panel.section}>
      <p className={styles.signedIn}>{user.name} olarak giriş yaptınız.</p>
      <form action={logout}>
        <Button type="submit" variant="secondary">
          Çıkış yap
        </Button>
      </form>
    </section>
  );
}

async function ShopPageLink() {
  const { shop } = await panelSession();
  return (
    <Link href={`/${shop.slug}`} className={styles.menuLink}>
      Dükkân sayfası
      <CaretRight size={20} aria-hidden="true" />
    </Link>
  );
}
