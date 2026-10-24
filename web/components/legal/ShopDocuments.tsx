// Alıcının dükkânla kurduğu sözleşmeler ve aydınlatma metni. Satıcı dükkândır, Tomurcuk aracı
// hizmet sağlayıcıdır. Metinler taslaktır; hukukçu görüşüyle güncellenince lib/legal/version.ts
// ve api ordering/Terms.VERSION birlikte artar.
import Link from "next/link";
import type { ReactNode } from "react";
import { PaymentMethod, type Shop } from "@/lib/api/types";
import { formatLongDate } from "@/lib/dates";
import { formatPrice } from "@/lib/format";
import { placedAtText, type ContractOrder } from "@/lib/legal/order";
import { documentPath, ShopDocument } from "@/lib/legal/documents";
import { OPERATOR } from "@/lib/legal/operator";
import styles from "./legal.module.css";

interface DocumentProps {
  shop: Shop;
  /** Ödeme adımında taslaktan, takip linkinde siparişten; yoksa genel metin. */
  order: ContractOrder | null;
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>{title}</h2>
      {children}
    </section>
  );
}

/** Satıcının kimliği; unvan girilmemişse dükkân adı yazılır. */
function SellerFacts({ shop }: { shop: Shop }) {
  return (
    <dl className={styles.facts}>
      <dt>Unvan</dt>
      <dd>{shop.legalName || shop.name}</dd>
      <dt>Adres</dt>
      <dd>{shop.address}</dd>
      <dt>Telefon</dt>
      <dd>{shop.phone}</dd>
      {shop.email && (
        <>
          <dt>E-posta</dt>
          <dd>{shop.email}</dd>
        </>
      )}
      {shop.taxNumber && (
        <>
          <dt>Vergi dairesi ve numarası</dt>
          <dd>
            {shop.taxOffice} {shop.taxNumber}
          </dd>
        </>
      )}
    </dl>
  );
}

function OperatorFacts() {
  return (
    <p>
      Sipariş, Satıcı&apos;nın Tomurcuk üzerindeki sipariş sayfasından verilir. Tomurcuk ({OPERATOR.name},{" "}
      {OPERATOR.address}, {OPERATOR.email}) 6563 sayılı Elektronik Ticaretin Düzenlenmesi Hakkında Kanun kapsamında aracı
      hizmet sağlayıcıdır; ürünün satıcısı değildir ve sözleşmenin tarafı değildir.
    </p>
  );
}

const paymentText = (method: PaymentMethod | null) =>
  method === PaymentMethod.Card
    ? "Kredi ya da banka kartıyla, ödeme kuruluşu iyzico üzerinden."
    : method === PaymentMethod.Transfer
      ? "Havale ya da EFT ile, Satıcı'nın hesabına."
      : "Kredi ya da banka kartıyla (iyzico üzerinden) ya da Satıcı'nın hesabına havale veya EFT ile; alıcı ödeme adımında seçer.";

/** Ürün, seçenekler ve vergiler dahil toplam; sipariş bilgisi yoksa nerede gösterildiği. */
function OrderFacts({ order }: { order: ContractOrder | null }) {
  if (!order) {
    return (
      <p>
        Ürün, seçilen boy ve eklemeler, teslimat ücreti ve vergiler dahil toplam tutar ödeme adımında, siparişi
        onaylamadan önce gösterilir.
      </p>
    );
  }
  return (
    <>
      <table className={styles.table}>
        <thead>
          <tr>
            <th scope="col">Ürün</th>
            <th scope="col">Adet</th>
            <th scope="col">Tutar</th>
          </tr>
        </thead>
        <tbody>
          {order.lines.map((line, i) => (
            <tr key={i}>
              <td>
                {line.name}
                {line.detail && <span className={styles.muted}> ({line.detail})</span>}
              </td>
              <td>{line.quantity}</td>
              <td>{formatPrice(line.total)}</td>
            </tr>
          ))}
          <tr>
            <td>Teslimat ücreti</td>
            <td />
            <td>{formatPrice(order.deliveryFee)}</td>
          </tr>
        </tbody>
        <tfoot>
          <tr>
            <th scope="row">Toplam, vergiler dahil</th>
            <td />
            <td>{formatPrice(order.total)}</td>
          </tr>
        </tfoot>
      </table>
    </>
  );
}

function DeliveryFacts({ order }: { order: ContractOrder | null }) {
  if (!order?.delivery) {
    return <p>Teslim adresi, tarih ve saat aralığı siparişin teslimat adımında alıcı tarafından seçilir.</p>;
  }
  const { delivery } = order;
  return (
    <dl className={styles.facts}>
      <dt>Teslim alacak kişi</dt>
      <dd>{delivery.recipientName}</dd>
      <dt>Adres</dt>
      <dd>{delivery.address}</dd>
      <dt>Tarih ve saat</dt>
      <dd>
        {formatLongDate(delivery.date)}, {delivery.slot} arası
      </dd>
    </dl>
  );
}

function NoWithdrawal() {
  return (
    <p>
      Çiçek ve bitkiler çabuk bozulabilen mallardır ve sipariş, kart notuyla birlikte alıcının isteğine göre
      hazırlanır. Bu nedenle Mesafeli Sözleşmeler Yönetmeliği&apos;nin 15. maddesinin birinci fıkrasının (b) ve (c)
      bentleri uyarınca cayma hakkı yoktur. Bu, ayıplı ürüne karşı yasal haklarınızı ortadan kaldırmaz.
    </p>
  );
}

function Complaints({ shop }: { shop: Shop }) {
  return (
    <p>
      Şikâyetlerinizi önce Satıcı&apos;ya iletin: {shop.phone}
      {shop.email ? `, ${shop.email}` : ""}. Uyuşmazlıkta Ticaret Bakanlığı&apos;nın her yıl belirlediği parasal sınırlar
      içinde yerleşim yerinizdeki ya da işlemin yapıldığı yerdeki tüketici hakem heyetine, sınırın üzerinde tüketici
      mahkemesine başvurabilirsiniz.
    </p>
  );
}

export function PreInformation({ shop, order }: DocumentProps) {
  return (
    <>
      <Section title="1. Satıcı">
        <SellerFacts shop={shop} />
      </Section>
      <Section title="2. Aracı hizmet sağlayıcı">
        <OperatorFacts />
      </Section>
      <Section title="3. Ürün ve fiyat">
        <OrderFacts order={order} />
      </Section>
      <Section title="4. Ödeme">
        <p>{paymentText(order?.paymentMethod ?? null)}</p>
        <p>Kart bilgileri ödeme kuruluşu tarafından alınır; Satıcı&apos;ya ve Tomurcuk&apos;a ulaşmaz.</p>
      </Section>
      <Section title="5. Teslimat">
        <DeliveryFacts order={order} />
        <p>
          Ürün, Satıcı tarafından seçilen gün ve saat aralığında adrese teslim edilir. Teslimat ücreti teslim
          bölgesine göredir ve toplam tutara dahildir.
        </p>
      </Section>
      <Section title="6. Cayma hakkı">
        <NoWithdrawal />
      </Section>
      <Section title="7. Şikâyet ve uyuşmazlık">
        <Complaints shop={shop} />
      </Section>
      <Section title="8. Saklama">
        <p>
          Bu form ve mesafeli satış sözleşmesi, sipariş onayı SMS&apos;indeki takip bağlantısından her zaman
          açılabilir.
        </p>
      </Section>
    </>
  );
}

export function DistanceSale({ shop, order }: DocumentProps) {
  return (
    <>
      <Section title="1. Taraflar">
        <p>
          Satıcı aşağıda bilgileri yazan dükkândır. Alıcı, siparişi veren ve ödemeyi yapan kişidir; iletişim bilgisi
          sipariş sırasında verdiği telefon numarasıdır.
        </p>
        <SellerFacts shop={shop} />
        <OperatorFacts />
      </Section>
      <Section title="2. Konu">
        <p>
          Bu sözleşme, Alıcı&apos;nın Satıcı&apos;dan elektronik ortamda sipariş ettiği ürünün satışı ve teslimine
          ilişkin hak ve yükümlülükleri 6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler
          Yönetmeliği&apos;ne göre düzenler.
        </p>
      </Section>
      <Section title="3. Ürün ve bedel">
        <OrderFacts order={order} />
        <p>{paymentText(order?.paymentMethod ?? null)}</p>
      </Section>
      <Section title="4. Teslimat">
        <DeliveryFacts order={order} />
        <p>
          Satıcı ürünü seçilen gün ve saat aralığında teslim eder. Teslim alacak kişiye ulaşılamazsa ya da adres
          eksikse Satıcı önce teslim alacak kişiyi, ulaşamazsa Alıcı&apos;yı arar ve yeni bir teslim saati birlikte
          belirlenir.
        </p>
        <p>
          Satıcı siparişi hazırlayamayacağını anlarsa (örneğin çiçek bulunamazsa) Alıcı&apos;ya teslim tarihinden önce
          bilgi verir. Alıcı kabul ederse eşdeğer bir ürün gönderilir; kabul etmezse ödenen tutarın tamamı en geç 14
          gün içinde iade edilir.
        </p>
      </Section>
      <Section title="5. Cayma hakkı">
        <NoWithdrawal />
      </Section>
      <Section title="6. Ayıplı ürün">
        <p>
          Ürün siparişe uygun değilse, solmuş ya da zarar görmüş teslim edildiyse Alıcı, 6502 sayılı Kanun&apos;un 11.
          maddesindeki haklarından birini seçebilir: sözleşmeden dönme, bedelde indirim ya da ürünün yenisiyle
          değiştirilmesi. Durumun fotoğrafla birlikte en kısa sürede Satıcı&apos;ya bildirilmesi çözümü hızlandırır.
        </p>
      </Section>
      <Section title="7. Kişisel veriler">
        <p>
          Sipariş için verilen bilgiler{" "}
          <Link href={documentPath(shop.slug, ShopDocument.Privacy)}>aydınlatma metninde</Link> anlatıldığı gibi
          işlenir.
        </p>
      </Section>
      <Section title="8. Uyuşmazlık">
        <Complaints shop={shop} />
      </Section>
      <Section title="9. Yürürlük">
        <p>
          Sözleşme, Alıcı&apos;nın ödeme adımında ön bilgilendirme formunu ve bu sözleşmeyi onaylamasıyla kurulur
          {order?.placedAt ? ` (${placedAtText(order.placedAt, shop.timeZone)} onaylandı)` : ""}.
        </p>
      </Section>
    </>
  );
}

export function DeliveryReturns({ shop }: Pick<DocumentProps, "shop">) {
  return (
    <>
      <Section title="Teslimat">
        <p>
          {shop.name} vitrinde yazan bölgelere teslim eder; ücret bölgeye göre değişir ve ödeme adımında toplam tutara
          eklenir. Teslim günü ve saat aralığı siparişte seçilir. Aynı gün teslim için siparişin saat{" "}
          {shop.sameDayCutoff}&apos;e kadar verilmesi gerekir.
        </p>
        <p>
          Teslim alacak kişiye ulaşılamazsa ya da adres eksikse dükkân önce onu, ulaşamazsa sizi arar ve yeni bir
          teslim saati birlikte belirlenir. Sipariş yola çıkınca teslim alacak kişiye, teslim edilince size SMS gider.
        </p>
      </Section>
      <Section title="İptal">
        <p>
          Sipariş hazırlanmaya başlamadan önce dükkânı arayarak iptal edebilirsiniz: {shop.phone}. Hazırlanmaya
          başlanan siparişte çiçekler kişiye özel hazırlandığı için cayma hakkı yoktur.
        </p>
      </Section>
      <Section title="Sorunlu teslimat ve iade">
        <p>
          Ürün siparişe uygun değilse ya da zarar görmüş teslim edildiyse fotoğrafla birlikte dükkâna bildirin.
          Seçiminize göre ürün yenisiyle değiştirilir, bedelde indirim yapılır ya da ücret iade edilir.
        </p>
        <p>
          Kartla ödenen tutar iyzico üzerinden ödemenin yapıldığı karta, havaleyle ödenen tutar bildireceğiniz
          hesaba en geç 14 gün içinde iade edilir. Kartınıza yansıma süresi bankanıza bağlıdır.
        </p>
      </Section>
    </>
  );
}

export function BuyerPrivacy({ shop }: Pick<DocumentProps, "shop">) {
  return (
    <>
      <Section title="Veri sorumlusu">
        <p>
          Siparişinizdeki kişisel veriler bakımından veri sorumlusu {shop.legalName || shop.name}&apos;dır (
          {shop.address}). Tomurcuk ({OPERATOR.name}) sipariş sayfasını, bildirimleri ve kayıtları dükkân adına
          işletir; dükkânın talimatıyla veri işleyendir.
        </p>
      </Section>
      <Section title="İşlenen veriler">
        <ul className={styles.list}>
          <li>Siparişi verenin adı (kart notundaki imza) ve telefon numarası.</li>
          <li>Teslim alacak kişinin adı, telefon numarası ve teslim adresi.</li>
          <li>Kart notu, sipariş içeriği, tutar ve ödeme durumu. Kart numarası işlenmez.</li>
          <li>Siparişin verildiği IP adresi ve işlem kayıtları.</li>
        </ul>
      </Section>
      <Section title="Amaç ve hukuki sebep">
        <p>
          Veriler siparişin alınması, hazırlanması ve teslimi, sipariş ve teslimat bilgilendirmesi (SMS), ödeme ve iade
          işlemleri, şikâyetlerin çözümü ve yasal yükümlülüklerin yerine getirilmesi için işlenir. Hukuki sebepler:
          sözleşmenin kurulması ve ifası (KVKK m. 5/2-c), hukuki yükümlülük (m. 5/2-ç) ve dolandırıcılığın önlenmesi
          gibi meşru menfaatler (m. 5/2-f). Teslim alacak kişinin bilgileri, siparişi veren tarafından teslimat için
          verilir.
        </p>
      </Section>
      <Section title="Aktarım">
        <p>
          Veriler yalnızca bu amaçlar için ve gerektiği kadar şunlarla paylaşılır: ödeme kuruluşu iyzico, SMS
          hizmeti sağlayıcısı, barındırma hizmeti ({OPERATOR.hosting}) ve talep hâlinde yetkili kamu kurumları.
          Pazarlama amacıyla kimseyle paylaşılmaz.
        </p>
      </Section>
      <Section title="Saklama süresi">
        <p>
          Sipariş kayıtları yasal saklama süreleri boyunca, ticari kayıtlarda 10 yıl saklanır; süre bitince silinir ya
          da anonim hâle getirilir.
        </p>
      </Section>
      <Section title="Haklarınız">
        <p>
          KVKK&apos;nın 11. maddesi uyarınca verilerinizin işlenip işlenmediğini öğrenme, bilgi isteme, düzeltilmesini
          ya da silinmesini isteme, aktarıldığı kişileri öğrenme, itiraz etme ve zararın giderilmesini isteme
          haklarınız vardır. Başvurunuzu dükkâna ({shop.email || shop.phone}) ya da Tomurcuk&apos;a ({OPERATOR.email})
          iletebilirsiniz; en geç 30 gün içinde yanıtlanır.
        </p>
      </Section>
    </>
  );
}
