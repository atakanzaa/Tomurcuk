import { Printer } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense, type ReactNode } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { CARD_NOTE_MAX_LENGTH, GiftTag } from "@/components/ui/GiftTag";
import { KraftBand } from "@/components/ui/KraftBand";
import { OrderList, OrderRow } from "@/components/ui/OrderRow";
import { ProductItem } from "@/components/ui/ProductItem";
import { StatusTag } from "@/components/ui/StatusTag";
import { TimeSlot, type TimeSlotOption } from "@/components/ui/TimeSlot";
import { renderProductPhoto } from "@/components/ProductPhoto";
import { findShop, getDeliveryDays, getOrders, getProducts, getTimeSlots } from "@/lib/api";
import { ShopLookupKind, type Shop } from "@/lib/api/types";
import { productPriceLabel } from "@/lib/catalog";
import { formatLongDate } from "@/lib/dates";
import { formatPrice, formatTimeRange } from "@/lib/format";
import { orderDelayMinutes, orderItemsSummary, orderStatusTag, orderTimeColumn } from "@/lib/order";
import { productPath } from "@/lib/routes";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Bileşenler · Tomurcuk",
  robots: { index: false, follow: false },
};

const PREVIEW_SHOP_SLUG = "nergis";
/** Sipariş satırlarındaki gecikme bu örnek saate göre hesaplanır. */
const PREVIEW_NOW = "12:00";
const LONG_NOTE =
  "Sevgili Elif, yeni evinin her köşesi kahkahayla dolsun. Taşınma telaşı bitince ilk kahveyi balkonda birlikte içelim; çiçekler de o güne kadar sana bizi hatırlatsın. Kapının her zaman açık olduğunu biliyorsun, biz de buradayız. Sevgiyle.";

export default function ComponentsPage() {
  return (
    <Suspense>
      <Preview />
    </Suspense>
  );
}

/** Örnek dükkânın verisiyle çalışır; veri derlemede değil istek anında okunur. */
async function Preview() {
  await connection();
  const lookup = await findShop(PREVIEW_SHOP_SLUG);
  if (lookup.kind !== ShopLookupKind.Found) throw new Error(`Önizleme dükkânı bulunamadı: ${PREVIEW_SHOP_SLUG}`);
  const { shop } = lookup;

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Bileşenler</h1>
          <p className={styles.lede}>
            design/tomurcuk bileşenlerinin React karşılıkları, tüm halleriyle. Veriler örnek dükkândan (nergis) gelir.
          </p>
        </div>
        <ThemeToggle />
      </header>

      <Section title="Button" note="Ekran başına bir birincil buton. Küçük boy görünüşte 36px, dokunma alanı 44px.">
        <Case label="Varsayılan boy (44px)">
          <div className={styles.row}>
            <Button>Siparişi tamamla</Button>
            <Button variant="secondary">Kart notunu düzenle</Button>
            <Button variant="quiet">Sepete geri dön</Button>
            <Button variant="danger">Siparişi iptal et</Button>
          </div>
        </Case>
        <Case label="Küçük boy (36px), ikonlu ikincil buton">
          <div className={styles.row}>
            <Button size="s">Yola çıktı</Button>
            <Button variant="secondary" size="s">
              <Printer size={20} aria-hidden="true" />
              Fişi yazdır
            </Button>
            <Button variant="danger" size="s">
              Siparişi iptal et
            </Button>
          </div>
        </Case>
        <Case label="Devre dışı; nedeni yanında yazar">
          <div className={styles.row}>
            <Button size="s" disabled aria-describedby="odeme-nedeni">
              Yola çıktı
            </Button>
            <span id="odeme-nedeni" className={styles.disabledReason}>
              Ödeme bekleniyor
            </span>
          </div>
        </Case>
        <Case label="Bağlantı olarak (tel:, uygulama içi)">
          <div className={styles.row}>
            <Button variant="secondary" size="s" href="tel:+902163380000">
              Ara
            </Button>
            <Button variant="quiet" href={`/${shop.slug}`}>
              Vitrine git
            </Button>
          </div>
        </Case>
        <Case label="Tam genişlik (mobil form sonu)">
          <div className={styles.stack}>
            <Button block>Teslimat bilgilerine geç</Button>
          </div>
        </Case>
      </Section>

      <Section title="Field" note="Etiket her zaman görünür. Zorunlu alan işaretlenmez, isteğe bağlı olan yazılır.">
        <div className={styles.stack}>
          <Field label="Alıcının adı" defaultValue="Elif Yılmaz" autoComplete="name" />
          <Field
            label="Alıcının telefonu"
            defaultValue="0532 412 88"
            inputMode="tel"
            autoComplete="tel"
            error="Numara eksik görünüyor. 10 hane olmalı, ör. 0532 412 88 19."
          />
          <Field
            as="textarea"
            label="Kart notu"
            placeholder="Karta yazılacak mesaj"
            defaultValue="Yeni evin hayırlı olsun, ilk çiçekler bizden."
            maxLength={CARD_NOTE_MAX_LENGTH}
            hint="İsterseniz boş bırakabilirsiniz."
          />
          <Field label="Kuryeye not" optional placeholder="Zil çalışmıyor, arayın." />
          <Field as="select" label="İlçe" defaultValue="Kadıköy">
            <option>Kadıköy</option>
            <option>Üsküdar</option>
            <option>Ataşehir</option>
          </Field>
          <Field label="Sipariş numarası" defaultValue="T-4821" disabled hint="Sipariş oluşunca değişmez." />
        </div>
      </Section>

      <Section title="StatusTag" note="Durum her zaman kelimeyle yazılır; renk eşlemesi sabittir.">
        <div className={styles.row}>
          <StatusTag tone="new">Yeni</StatusTag>
          <StatusTag tone="preparing">Hazırlanıyor</StatusTag>
          <StatusTag tone="onway">Yolda</StatusTag>
          <StatusTag tone="delivered">Teslim edildi</StatusTag>
          <StatusTag tone="failed">Teslim edilemedi</StatusTag>
          <StatusTag tone="failed">İptal</StatusTag>
          <StatusTag tone="muted">Ödeme bekleniyor</StatusTag>
        </div>
      </Section>

      <Section
        title="TimeSlot"
        note="Ok tuşlarıyla gezilir, dolu aralık atlanır. 3 ve altı kalan yer sayıyla yazılır."
      >
        <Suspense fallback={null}>
          <TimeSlotCases shop={shop} />
        </Suspense>
      </Section>

      <Section
        title="OrderRow"
        note={`Satırın tamamı dokunulabilir. Gecikme örnek saat ${PREVIEW_NOW}'a göre hesaplandı; seçili satır kraft zeminle.`}
      >
        <Suspense fallback={null}>
          <OrderRows shop={shop} />
        </Suspense>
      </Section>

      <Section title="GiftTag" note="Kart notu etiketi. Ekranda en fazla bir tane; burada üç hali yan yana.">
        <Case label="Gönderen adıyla">
          <GiftTag message="Yeni evin hayırlı olsun, ilk çiçekler bizden." from="Ayşe ve Can" />
        </Case>
        <Case label="İsimsiz gönderim">
          <GiftTag message="İyi ki doğdun." from="Ayşe ve Can" anonymous />
        </Case>
        <Case label={`En uzun hali (${LONG_NOTE.length} / ${CARD_NOTE_MAX_LENGTH} karakter)`}>
          <GiftTag message={LONG_NOTE} from="Zeynep" />
        </Case>
      </Section>

      <Section title="ProductItem" note="Kutusuz ürün. Boy seçeneği olan üründe fiyat en küçük boydan başlar.">
        <ProductCases shop={shop} />
      </Section>

      <Section title="KraftBand" note="Sayfa başına en fazla bir bant: tek cümle, bir eylem.">
        <div className={styles.bands}>
          <KraftBand
            action={
              <Button variant="secondary" size="s">
                Fişleri yazdır
              </Button>
            }
          >
            <strong>Bugün 14 teslimat</strong>, 3&apos;ü öğleden önce.
          </KraftBand>
          <KraftBand tone="peony">
            <strong>Cuma, 4 müşterinin özel günü.</strong> Hatırlatma mesajı gönderebilirsiniz.
          </KraftBand>
        </div>
      </Section>
    </main>
  );
}

function Section({ title, note, children }: { title: string; note: string; children: ReactNode }) {
  return (
    <section className={styles.section} aria-labelledby={`bilesen-${title}`}>
      <h2 id={`bilesen-${title}`} className={styles.sectionTitle}>
        {title}
      </h2>
      <p className={styles.note}>{note}</p>
      {children}
    </section>
  );
}

function Case({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className={styles.case}>
      <p className={styles.caseLabel}>{label}</p>
      {children}
    </div>
  );
}

async function TimeSlotCases({ shop }: { shop: Shop }) {
  // Yarının kapasitesi; bugünün aralıkları saate göre kapanmış olabilir.
  const [slots, days] = await Promise.all([getTimeSlots(shop.id), getDeliveryDays(shop.id, 2)]);
  const tomorrow = days[1];
  const options: TimeSlotOption[] = slots.map((slot) => ({
    id: slot.id,
    label: formatTimeRange(slot.start, slot.end),
    remaining: tomorrow?.slots.find((s) => s.slotId === slot.id)?.remaining ?? slot.capacity,
  }));

  return (
    <>
      <Case label="Dolu, az yer kalmış ve müsait aralıklar">
        <span id="slot-yarin" className={styles.slotLabel}>
          Teslim saati, {tomorrow ? formatLongDate(tomorrow.date) : "yarın"}
        </span>
        <TimeSlot labelledBy="slot-yarin" options={options} defaultValue="s_ogle" name="saat" />
      </Case>
      <Case label="Aynı gün son saati geçti">
        <span id="slot-bugun" className={styles.slotLabel}>
          Teslim saati, bugün
        </span>
        <TimeSlot labelledBy="slot-bugun" options={options} closedMessage="Bugün için kapandı" />
      </Case>
    </>
  );
}

async function OrderRows({ shop }: { shop: Shop }) {
  const orders = await getOrders(shop.id);
  return (
    <OrderList className={styles.orders}>
      {orders.map((order) => {
        const delay = orderDelayMinutes(order, PREVIEW_NOW);
        const { time, slot } = orderTimeColumn(order, delay);
        return (
          <OrderRow
            key={order.id}
            href={`/panel/siparisler/${order.id}`}
            time={time}
            slot={slot}
            recipient={order.recipientName}
            place={order.zoneName}
            items={orderItemsSummary(order)}
            status={orderStatusTag(order)}
            amount={formatPrice(order.total)}
            late={delay > 0}
            selected={order.number === "T-4821"}
          />
        );
      })}
    </OrderList>
  );
}

async function ProductCases({ shop }: { shop: Shop }) {
  const products = await getProducts(shop.id);
  const sample = products.filter((p) => ["p_mevsim", "p_beyaz_gul"].includes(p.id));
  const sizes = "(min-width: 640px) 200px, 50vw";
  return (
    <div className={styles.products}>
      {sample.map((product) => (
        <ProductItem
          key={product.id}
          href={productPath(shop.slug, product.id)}
          name={product.name}
          summary={product.summary}
          price={productPriceLabel(product)}
          photo={renderProductPhoto(product, sizes)}
        />
      ))}
      <ProductItem href={productPath(shop.slug, "p_monstera")} name="Fotoğrafsız ürün" summary="Saksıda" price="1.100 TL" />
    </div>
  );
}
