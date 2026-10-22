import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { FlowHeader } from "@/components/flow/FlowHeader";
import flow from "@/components/flow/flow.module.css";
import { Button } from "@/components/ui/Button";
import { CheckoutStep, checkoutPath } from "@/lib/routes";
import styles from "./fake.module.css";

export const metadata: Metadata = { title: "Deneme ödemesi", robots: { index: false } };

/**
 * Geliştirme ve önizlemedeki sahte ödeme sağlayıcısının sayfası (api: FakePaymentProvider).
 * iyzico'nun sayfası gibi davranır: token'ı dönüş adresine form olarak POST eder. Yalnızca
 * sahte sağlayıcının token'larıyla açılır.
 */
export default function FakePaymentPage({ params, searchParams }: PageProps<"/[slug]/siparis/odeme/deneme">) {
  return (
    <Suspense>
      <FakePayment params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function FakePayment({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await connection();
  const { slug } = await params;
  const { token } = await searchParams;
  if (typeof token !== "string" || !token.startsWith("fake_")) notFound();
  const returnPath = `/${slug}/siparis/odeme/sonuc`;

  return (
    <>
      <FlowHeader back={{ href: checkoutPath(slug, CheckoutStep.Payment), label: "Ödeme" }} step={3} />
      <div className={flow.body}>
        <h1 className={flow.title}>Deneme ödemesi</h1>
        <p className={flow.note}>
          Bu sayfa geliştirme ortamında iyzico&apos;nun ödeme sayfasının yerini tutar. Kart bilgisi istenmez, para
          çekilmez.
        </p>
        <div className={styles.actions}>
          <form method="post" action={returnPath}>
            <input type="hidden" name="token" value={token} />
            <Button type="submit" block>
              Ödemeyi onayla
            </Button>
          </form>
          {/* Bilinmeyen token: dönüşte ödeme başarısız sayılır, alıcı ödeme adımına geri gelir. */}
          <form method="post" action={returnPath}>
            <input type="hidden" name="token" value={`${token}_yarida`} />
            <Button type="submit" variant="secondary" block>
              Ödemeyi yarıda bırak
            </Button>
          </form>
        </div>
      </div>
    </>
  );
}
