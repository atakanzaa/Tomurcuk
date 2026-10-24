import type { Metadata } from "next";
import { effectiveDate, LegalPage } from "@/components/legal/LegalPage";
import legal from "@/components/legal/legal.module.css";
import { PlatformPrivacy } from "@/components/legal/PlatformDocuments";
import { Logo } from "@/components/ui/Logo";
import { TERMS_DATE } from "@/lib/legal/version";

export const metadata: Metadata = { title: "Gizlilik ve çerezler · Tomurcuk" };

export default function PrivacyPage() {
  return (
    <>
      <header className={legal.platformHeader}>
        <Logo href="/" />
      </header>
      <LegalPage
        title="Gizlilik ve çerezler"
        meta={effectiveDate(TERMS_DATE)}
        others={[{ href: "/kullanim-kosullari", label: "Çiçekçiler için hizmet koşulları" }]}
      >
        <PlatformPrivacy />
      </LegalPage>
    </>
  );
}
