import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { GiftTag } from "@/components/ui/GiftTag";
import { OrderList } from "@/components/ui/OrderRow";
import { StatusTag } from "@/components/ui/StatusTag";
import { PLANS } from "@/lib/marketing";
import { formatPrice } from "@/lib/format";
import { PilotForm } from "./PilotForm";
import styles from "./landing.module.css";

export const metadata: Metadata = {
  title: "Tomurcuk · Küçük çiçekçilerin sipariş sayfası ve paneli",
  description:
    "Instagram ve WhatsApp'tan gelen siparişlerinizi tek ekranda toplayın, müşterinizi kaybetmeyin, komisyon ödemeyin.",
};

const STEPS = [
  {
    title: "Sipariş linkini paylaşın",
    body: "Linki Instagram bio'nuza ve WhatsApp mesajlarınıza koyarsınız. Müşteri DM'den fiyat sormak yerine ürünü seçer, teslim saatini ve kart notunu yazar, kartla öder.",
  },
  {
    title: "Tüm siparişler tek ekrana düşer",
    body: "Linkten gelenler kendiliğinden, telefondan ve dükkândan gelenler 30 saniyede eklenir. Sabah telefonunuzu açtığınızda günün siparişleri saat sırasıyla önünüzdedir.",
  },
  {
    title: "Müşteriniz sizi unutmaz",
    body: "Her sipariş müşteri kartına işlenir. Annesinin doğum günü, evlilik yıl dönümü yaklaşınca Tomurcuk size hatırlatır; tek dokunuşla WhatsApp mesajı gönderirsiniz.",
  },
];

const COMPARISON = [
  ["Sipariş başına komisyon", "Yok, sabit aylık ücret", "Her siparişten kesinti"],
  ["Müşteri bilgisi", "Sizde kalır", "Platformda kalır"],
  ["Fiyatınızı kim belirler", "Siz", "Yan yana listelenen rakipler"],
  ["Yeni müşteri getirir mi", "Hayır, kendi kanallarınızla çalışır", "Evet"],
  ["Telefon ve WhatsApp siparişleri", "Aynı ekranda", "Ayrı tutulur"],
];

const FAQ = [
  ["Pazaryerindeki mağazamı kapatmam gerekir mi?", "Hayır. Oradan gelen siparişleri de tek dokunuşla panele ekleyebilir, tüm gününüzü tek yerden yönetebilirsiniz."],
  ["Kart ödemeleri nereye yatar?", "Doğrudan sizin hesabınıza. Ödemeyi lisanslı ödeme kuruluşu alır; para Tomurcuk'un hesabından geçmez."],
  ["Kurulumu kim yapar?", "Biz. Ürünlerinizi, fotoğraflarınızı ve teslim bölgelerinizi yükler, linkinizi hazır teslim ederiz."],
  ["Bir sorun olursa kime ulaşırım?", "Panelden destek talebi açarsınız. Bugün teslim edilecek bir siparişle ilgiliyse 15 dakika içinde dönüyoruz."],
];

const SHOWCASE = [
  { time: "13–16", who: "Elif Yılmaz", where: "Caferağa, Kadıköy", tone: "new" as const, status: "Yeni", channel: "Linkten" },
  { time: "14:00", who: "Mert Kaya", where: "Kuzguncuk, Üsküdar", tone: "preparing" as const, status: "Hazırlanıyor", channel: "Telefondan" },
  { time: "16–19", who: "Hande Demir", where: "Göztepe, Kadıköy", tone: "onway" as const, status: "Yolda", channel: "WhatsApp'tan" },
];

export default function LandingPage() {
  return (
    <>
      <header className={`${styles.wrap} ${styles.header}`}>
        <span className={styles.logo}>Tomurcuk</span>
        <nav aria-label="Sayfa" className={styles.nav}>
          <a className={`${styles.navLink} ${styles.navOptional}`} href="#nasil">
            Nasıl çalışır
          </a>
          <a className={`${styles.navLink} ${styles.navOptional}`} href="#fiyat">
            Fiyat
          </a>
          <a className={`${styles.navLink} ${styles.navOptional}`} href="#sss">
            Sorular
          </a>
          <Link className={styles.navLink} href="/panel">
            Giriş yap
          </Link>
          <Button size="s" href="#basvuru">
            Pilota katılın
          </Button>
        </nav>
      </header>

      <main>
        <section className={`${styles.wrap} ${styles.hero}`}>
          <div className={styles.heroText}>
            <h1 className={styles.h1}>Siparişleriniz deftere değil, tek ekrana düşsün.</h1>
            <p className={styles.lead}>
              Tomurcuk küçük çiçekçiler için üç şey yapar. Instagram bio&apos;nuza koyacağınız bir sipariş sayfası verir. Telefondan gelen siparişi
              30 saniyede girmenizi sağlar. Müşterilerinizin özel günlerini size hatırlatır. Sipariş başına komisyon yok.
            </p>
            <div className={styles.ctaRow}>
              <Button href="#basvuru" className={styles.bigButton}>
                Ücretsiz pilota katılın
              </Button>
              <Button variant="quiet" href="/nergis">
                Örnek dükkân sayfasını açın
              </Button>
            </div>
            <span className={styles.small}>İlk 5 çiçekçi için 3 ay ücretsiz. Kurulumu biz yapıyoruz.</span>
          </div>

          <div className={styles.showcase} role="img" aria-label="Tomurcuk arayüzünden parçalar: günün siparişleri, kart notu etiketi ve özel gün hatırlatması">
            <div className={styles.mini} aria-hidden="true">
              <div className={styles.miniHead}>
                <span>Bugün, öğleden sonra</span>
                <span>8 teslimat</span>
              </div>
              <OrderList>
                {SHOWCASE.map((o) => (
                  <li key={o.who} className="tm-order">
                    <div>
                      <span className="tm-order__time">{o.time}</span>
                    </div>
                    <div>
                      <div className="tm-order__who">{o.who}</div>
                      <div className="tm-order__where">{o.where}</div>
                    </div>
                    <div className="tm-order__side">
                      <StatusTag tone={o.tone}>{o.status}</StatusTag>
                      <span className={styles.channel}>{o.channel}</span>
                    </div>
                  </li>
                ))}
              </OrderList>
            </div>
            <div className={styles.showcaseFoot} aria-hidden="true">
              <GiftTag className={styles.tag} message="İyi ki doğdun ablacım, bu yıl da yanındayız." from="Ayşe" />
              <div className={styles.bubble}>
                <span className={styles.bubbleKicker}>Cuma, özel gün</span>
                <span className={styles.bubbleText}>Ayşe Hanım, geçen yıl annenize mevsim buketi göndermiştiniz. Bu yıl da hazırlayalım mı?</span>
              </div>
            </div>
          </div>
        </section>

        <section id="nasil" className={styles.band} aria-labelledby="nasil-baslik">
          <div className={`${styles.wrap} ${styles.split}`}>
            <div className={styles.splitIntro}>
              <h2 id="nasil-baslik" className={styles.h2}>
                Bir gününüz nasıl değişir?
              </h2>
              <p className={styles.lead}>Kurulumu birlikte yaparız: ürünlerinizi ve teslim bölgelerinizi biz yükleriz, siz ilk siparişi alırsınız.</p>
            </div>
            <ol className={styles.steps}>
              {STEPS.map((step, i) => (
                <li key={step.title} className={styles.step}>
                  <span className={styles.stepNumber} aria-hidden="true">
                    {i + 1}
                  </span>
                  <div>
                    <h3 className={styles.stepTitle}>{step.title}</h3>
                    <p className={styles.stepBody}>{step.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className={`${styles.wrap} ${styles.compare}`} aria-labelledby="karsilastirma">
          <div className={styles.compareIntro}>
            <h2 id="karsilastirma" className={styles.h2}>
              Pazaryerini bırakmayın, yanına kendi kapınızı açın.
            </h2>
            <p className={styles.lead}>Pazaryeri size yeni müşteri getirir. Tomurcuk o müşterinin bir dahaki sefere doğrudan size gelmesini sağlar.</p>
          </div>
          <div className={styles.tableWrap}>
            <table className={styles.cmp}>
              <thead>
                <tr>
                  <th>
                    <span className="visually-hidden">Konu</span>
                  </th>
                  <th>Tomurcuk ile kendi sayfanız</th>
                  <th>Çiçek pazaryerleri</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map(([topic, ours, theirs]) => (
                  <tr key={topic}>
                    <td>{topic}</td>
                    <td>{ours}</td>
                    <td>{theirs}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section id="fiyat" className={styles.pricing} aria-labelledby="fiyat-baslik">
          <div className={`${styles.wrap} ${styles.split}`}>
            <div className={styles.splitIntro}>
              <h2 id="fiyat-baslik" className={styles.h2}>
                Sabit fiyat. Komisyon yok.
              </h2>
              <p className={styles.pricingLead}>
                Kart ödemelerinde yalnızca ödeme kuruluşunun kendi kesintisi uygulanır; Tomurcuk siparişinizden pay almaz.
              </p>
            </div>
            <div className={styles.plans}>
              {PLANS.map((plan) => (
                <div key={plan.name} className={styles.plan}>
                  <span className={styles.planName}>{plan.name}</span>
                  <span className={styles.planPrice}>
                    {plan.monthlyPrice === null ? (
                      "Belirleniyor"
                    ) : (
                      <>
                        {formatPrice(plan.monthlyPrice)}
                        <span className={styles.planUnit}> / ay</span>
                      </>
                    )}
                  </span>
                  <span className={styles.planText}>{plan.summary}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="sss" className={`${styles.wrap} ${styles.split}`} aria-labelledby="sss-baslik">
          <h2 id="sss-baslik" className={`${styles.h2} ${styles.splitIntro}`}>
            Sık sorulanlar
          </h2>
          <div className={styles.faqList}>
            {FAQ.map(([q, a]) => (
              <div key={q} className={styles.qa}>
                <h3 className={styles.qaQ}>{q}</h3>
                <p className={styles.qaA}>{a}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="basvuru" className={styles.apply} aria-labelledby="basvuru-baslik">
          <div className={`${styles.wrap} ${styles.split}`}>
            <div className={styles.splitIntro}>
              <h2 id="basvuru-baslik" className={styles.h2}>
                Pilot dükkânlardan biri olun.
              </h2>
              <p className={styles.pricingLead}>5 çiçekçiyle başlıyoruz. 3 ay ücretsiz kullanırsınız, haftada bir 15 dakika ne işe yarayıp yaramadığını konuşuruz.</p>
            </div>
            <PilotForm />
          </div>
        </section>
      </main>

      <footer className={`${styles.wrap} ${styles.footer}`}>
        <span>
          <span className={styles.footerLogo}>Tomurcuk</span> Küçük çiçekçilerin sipariş sayfası, paneli ve müşteri defteri.
        </span>
        <span className={styles.footerLinks}>
          <a href="#basvuru">İletişim</a>
          <Link href="/panel">Çiçekçi girişi</Link>
        </span>
      </footer>
    </>
  );
}
