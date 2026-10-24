import type { Metadata } from "next";
import { effectiveDate, LegalPage } from "@/components/legal/LegalPage";
import legal from "@/components/legal/legal.module.css";
import { FloristTerms } from "@/components/legal/PlatformDocuments";
import { Logo } from "@/components/ui/Logo";
import { TERMS_DATE } from "@/lib/legal/version";

export const metadata: Metadata = { title: "Çiçekçiler için hizmet koşulları · Tomurcuk" };

export default function TermsPage() {
  return (
    <>
      <header className={legal.platformHeader}>
        <Logo href="/" />
      </header>
      <LegalPage
        title="Çiçekçiler için hizmet koşulları"
        meta={effectiveDate(TERMS_DATE)}
        others={[{ href: "/gizlilik", label: "Gizlilik ve çerezler" }]}
      >
        <FloristTerms />
      </LegalPage>
    </>
  );
}
