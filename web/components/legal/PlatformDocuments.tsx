// Tomurcuk'un kendi metinleri: sitenin ve çiçekçi hesaplarının aydınlatma metni, çiçekçiler için
// hizmet koşulları. Taslaktır; işletici bilgileri lib/legal/operator.ts'te.
import type { ReactNode } from "react";
import { OPERATOR } from "@/lib/legal/operator";
import styles from "./legal.module.css";

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>{title}</h2>
      {children}
    </section>
  );
}

export function PlatformPrivacy() {
  return (
    <>
      <Section title="Veri sorumlusu">
        <p>
          Bu metin Tomurcuk&apos;un ({OPERATOR.name}, {OPERATOR.address}) kendi adına işlediği verileri anlatır.
          Dükkânlardan verilen siparişlerdeki veriler için veri sorumlusu siparişin verildiği dükkândır; onun
          aydınlatma metni dükkânın sayfasındadır.
        </p>
      </Section>
      <Section title="İşlenen veriler">
        <ul className={styles.list}>
          <li>Çiçekçi başvuru formu: dükkân adı, telefon, ilçe ve Instagram hesabı.</li>
          <li>Panel hesapları: ad, e-posta, şifrenin özeti (şifrenin kendisi saklanmaz) ve giriş kayıtları.</li>
          <li>Destek yazışmaları ve destek ekibinin yaptığı işlemlerin kayıtları.</li>
          <li>Site ziyaretlerinde IP adresi ve işlem kayıtları.</li>
        </ul>
      </Section>
      <Section title="Amaç ve hukuki sebep">
        <p>
          Başvurulara dönüş yapmak, çiçekçilere hizmeti sunmak, hesap güvenliğini sağlamak, destek vermek ve yasal
          yükümlülükleri yerine getirmek. Hukuki sebepler: sözleşmenin kurulması ve ifası (KVKK m. 5/2-c), hukuki
          yükümlülük (m. 5/2-ç) ve güvenlik gibi meşru menfaatler (m. 5/2-f).
        </p>
      </Section>
      <Section title="Çerezler">
        <p>
          Yalnızca sitenin çalışması için zorunlu çerezler kullanılır: sipariş adımlarını hatırlayan çerez
          (tomurcuk_taslak), panel ve destek oturumu çerezleri. Açık ya da koyu tema tercihi yalnızca tarayıcınızda
          saklanır. Reklam ya da ziyaretçi takibi için çerez kullanılmaz.
        </p>
      </Section>
      <Section title="Aktarım ve saklama">
        <p>
          Veriler barındırma hizmeti ({OPERATOR.hosting}), e-posta ve SMS hizmeti sağlayıcılarıyla yalnızca hizmet için
          gerektiği kadar paylaşılır. Başvuru bilgileri sonuçlandıktan sonra bir yıl, hesap bilgileri hesap kapandıktan
          sonra yasal süreler boyunca saklanır.
        </p>
      </Section>
      <Section title="Haklarınız">
        <p>
          KVKK&apos;nın 11. maddesindeki haklarınız için {OPERATOR.email} adresine yazabilirsiniz; en geç 30 gün içinde
          yanıtlanır.
        </p>
      </Section>
    </>
  );
}

export function FloristTerms() {
  return (
    <>
      <Section title="1. Taraflar ve hizmet">
        <p>
          Bu koşullar Tomurcuk ({OPERATOR.name}) ile Tomurcuk&apos;u kullanan çiçekçi arasındadır. Tomurcuk çiçekçiye
          sipariş sayfası, sipariş paneli, müşteri defteri ve bildirimler sunar. Ürünün satıcısı çiçekçidir;
          Tomurcuk aracı hizmet sağlayıcıdır.
        </p>
      </Section>
      <Section title="2. Çiçekçinin yükümlülükleri">
        <ul className={styles.list}>
          <li>Ürün, fiyat, teslim bölgesi ve dükkân bilgilerini doğru ve güncel tutmak.</li>
          <li>Siparişleri seçilen gün ve saatte teslim etmek; teslim edemeyeceği siparişte alıcıya haber vermek.</li>
          <li>Faturayı kendi sistemiyle kesmek ve tüketici mevzuatına uymak.</li>
          <li>Kendi çektiği ya da kullanma hakkı olan fotoğrafları yüklemek.</li>
          <li>Panel şifresini korumak ve çalışan hesaplarını yalnızca çalışanlarına açmak.</li>
        </ul>
      </Section>
      <Section title="3. Ödeme ve ücret">
        <p>
          Alıcının kartla ödediği tutar ödeme kuruluşu üzerinden doğrudan çiçekçinin hesabına geçer; Tomurcuk paraya
          dokunmaz. Tomurcuk&apos;un ücreti çiçekçinin seçtiği plana göredir ve sipariş başına komisyon alınmaz. Pilot
          süresinde ücret alınmaz.
        </p>
      </Section>
      <Section title="4. Veriler">
        <p>
          Çiçekçinin müşterilerine ait veriler bakımından veri sorumlusu çiçekçidir; Tomurcuk bu verileri yalnızca
          hizmeti sunmak için, çiçekçi adına işler. Destek ekibi çiçekçinin verisine yalnızca destek için, gerekçe
          yazarak ve kayıt altında erişir; dükkân adına açılan oturumdan çiçekçiye haber gider.
        </p>
      </Section>
      <Section title="5. Hizmetin sürekliliği">
        <p>
          Tomurcuk hizmeti kesintisiz sunmak için makul özeni gösterir; planlı bakımlar önceden bildirilir. Kesintiden
          doğan dolaylı zararlardan sorumlu değildir.
        </p>
      </Section>
      <Section title="6. Fesih">
        <p>
          Çiçekçi hesabını istediği zaman kapatabilir. Kapanışta siparişlerinin ve müşteri listesinin bir kopyasını
          isteyebilir; veriler yasal saklama süreleri sonunda silinir. Koşullara aykırı kullanımda Tomurcuk hesabı askıya
          alabilir.
        </p>
      </Section>
      <Section title="7. Değişiklikler">
        <p>Koşullar değişirse çiçekçiye en az 15 gün önce e-postayla bildirilir.</p>
      </Section>
    </>
  );
}
