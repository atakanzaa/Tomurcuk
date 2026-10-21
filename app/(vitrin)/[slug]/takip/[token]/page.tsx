import { Phone } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { Button } from "@/components/ui/Button";
import { GiftTag } from "@/components/ui/GiftTag";
import { KraftBand } from "@/components/ui/KraftBand";
import { findShop, getOrderTracking } from "@/lib/api";
import { ShopLookupKind } from "@/lib/api/types";
import { phoneHref, whatsappHref, withDativeSuffix } from "@/lib/format";
import { shopPath } from "@/lib/routes";
import { buildTrackingView } from "@/lib/tracking";
import { renderPhoto } from "../../_components/ProductPhoto";
import styles from "./tracking.module.css";

// Takip linki kişiye özeldir; arama motorlarına kapalı.
export const metadata: Metadata = { title: "Sipariş takibi", robots: { index: false, follow: false } };

export default function TrackingPage({ params }: PageProps<"/[slug]/takip/[token]">) {
  return (
    <Suspense>
      <Tracking params={params} />
    </Suspense>
  );
}

async function Tracking({ params }: { params: Promise<{ slug: string; token: string }> }) {
  await connection();
  const { slug, token } = await params;
  const lookup = await findShop(slug);
  if (lookup.kind !== ShopLookupKind.Found) notFound();
  const { shop } = lookup;
  const order = await getOrderTracking(shop.id, token);
  if (!order) notFound();
  const view = buildTrackingView(order, shop, new Date());

  return (
    <>
      <header className={styles.header}>
        <Link href={shopPath(shop.slug)} className={styles.brand}>
          {shop.shortName}
        </Link>
        <span className={styles.number}>Sipariş {order.number}</span>
      </header>
      <main className={styles.body}>
        <section className={styles.intro}>
          <h1 className={styles.title}>{view.title}</h1>
          <p className={styles.lede}>{view.lede}</p>
        </section>

        {view.paymentPending && (
          <KraftBand>
            <strong>Ödeme bekleniyor.</strong> Havale açıklamasına {order.number} yazın; ödeme dükkânın hesabına
            geçince sipariş hazırlanır.
          </KraftBand>
        )}

        {view.photoCaption && order.deliveryPhotoUrl && (
          <figure className={styles.photoFigure}>
            <div className={styles.photo}>
              {renderPhoto(order.deliveryPhotoUrl, "(min-width: 640px) 560px, 100vw")}
            </div>
            <figcaption className={styles.caption}>{view.photoCaption}</figcaption>
          </figure>
        )}

        {view.steps && (
          <ol aria-label="Sipariş durumu" className={styles.steps}>
            {view.steps.map((step, index) => (
              <li
                key={step.label}
                className={styles.step}
                data-done={step.done}
                aria-current={step.current ? "step" : undefined}
              >
                <div className={styles.rail} aria-hidden="true">
                  <span className={styles.dot} />
                  {index < view.steps!.length - 1 && (
                    <span className={styles.line} data-done={view.steps![index + 1].done} />
                  )}
                </div>
                <div className={styles.stepText}>
                  <span className={styles.stepLabel}>{step.label}</span>
                  {step.time && <span className={styles.stepTime}>{step.time}</span>}
                </div>
              </li>
            ))}
          </ol>
        )}

        {order.cardNote && (
          <GiftTag className={styles.tag} message={order.cardNote} from={order.signature} anonymous={order.anonymous} />
        )}

        <section className={styles.contact}>
          <span>Bir sorun mu var? {withDativeSuffix(shop.shortName)} doğrudan ulaşın.</span>
          <div className={styles.contactButtons}>
            <Button variant="secondary" href={phoneHref(shop.phone)}>
              <Phone size={20} aria-hidden="true" />
              Ara
            </Button>
            <Button variant="secondary" href={whatsappHref(shop.phone)}>
              WhatsApp&apos;tan yaz
            </Button>
          </div>
          <span className={styles.smallPrint}>
            Bu sayfanın linki {order.senderPhone} numarasına SMS ile gönderildi.
          </span>
        </section>
      </main>
    </>
  );
}
