import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { renderPhoto } from "@/components/ProductPhoto";
import { Button } from "@/components/ui/Button";
import { GiftTag } from "@/components/ui/GiftTag";
import { Logo, LogoMark } from "@/components/ui/Logo";
import { ProductItem } from "@/components/ui/ProductItem";
import { discoverShops, getAreas, getShopPicks } from "@/lib/api";
import { Availability, type Area, type IsoDate, type ProductCard, type ShopMatch } from "@/lib/api/types";
import { BOOKING_WINDOW_DAYS } from "@/lib/checkout/limits";
import { addDays, daysBetween, formatDayMonth, formatDeliveryDay, formatLongDate, relativeDayName } from "@/lib/dates";
import { areaLabel, areaValue, parseArea, parseDay, SEARCH_PARAMS } from "@/lib/discover";
import { formatPrice, formatPriceFrom, formatTimeRange, joinWithAnd, withDativeSuffix, withTimeSuffix, zonedNow } from "@/lib/format";
import { productPath, shopPath } from "@/lib/routes";
import { DiscoverForm } from "./_components/DiscoverForm";
import { OrderLookup } from "./_components/OrderLookup";
import styles from "./landing.module.css";
import home from "./home.module.css";

export const metadata: Metadata = {
  title: "Tomurcuk · Semtinizdeki çiçekçiden sipariş",
  description:
    "Teslim edilecek semti ve günü seçin, o gün oraya teslim eden çiçekçileri görün, siparişi doğrudan dükkândan verin.",
};

/** "Bugün"ün başvuru saat dilimi; dükkânların kendi hesabı backend'de. */
const PLATFORM_ZONE = "Europe/Istanbul";

const STEPS = [
  {
    title: "Semti ve günü seçin",
    body: "Yalnızca o gün o adrese teslim edebilen çiçekçiler listelenir. Son sipariş saati ve müsait saat aralıkları her dükkânın satırında yazar.",
  },
  {
    title: "Siparişi dükkândan verin",
    body: "Ürünü, teslim saatini ve kart notunu dükkânın kendi sayfasında seçersiniz. Ödeme iyzico ile alınır; kart bilgileriniz ne çiçekçiye ne Tomurcuk'a ulaşır.",
  },
  {
    title: "Yola çıkınca haber alın",
    body: "Çiçekçi siparişi yola çıkardığında alıcıya SMS gider, teslim edildiğinde size. Sipariş numaranız ve telefonunuzla durumu her an görebilirsiniz.",
  },
];

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

export default function HomePage({ searchParams }: PageProps<"/">) {
  return (
    <>
      <header className={`${styles.wrap} ${styles.header}`}>
        <Logo href="/" className={home.logo} />
        <nav aria-label="Sayfa" className={styles.nav}>
          <a className={`${styles.navLink} ${styles.navOptional}`} href="#nasil">
            Nasıl çalışır
          </a>
          <a className={styles.navLink} href="#takip">
            Siparişimi bul
          </a>
          <Button size="s" variant="secondary" href="/cicekciler">
            Çiçekçiler için
          </Button>
        </nav>
      </header>

      <main>
        <section className={`${styles.wrap} ${home.hero}`}>
          <div className={home.heroText}>
            <h1 className={home.h1}>Semtinizdeki çiçekçiden, bugün kapıda.</h1>
            <p className={styles.lead}>
              Tomurcuk&apos;taki çiçekler mahallenin çiçekçisinden gelir. Teslim edilecek semti ve günü seçin, o gün oraya teslim eden dükkânları
              görün, siparişi doğrudan dükkândan verin.
            </p>
            <Suspense fallback={<div className={home.searchPlaceholder} />}>
              <Search searchParams={searchParams} />
            </Suspense>
          </div>
          <div className={home.heroArt} aria-hidden="true">
            <span className={home.heroPhoto}>Bu haftanın lalesi</span>
            <div className={home.heroStack}>
              <GiftTag className={home.heroTag} message="Yeni evin hayırlı olsun, ilk çiçekler bizden." from="Deniz ve Ali" />
              <span className={`${home.heroPhoto} ${home.heroPhotoSquare}`}>Pembe şakayık</span>
            </div>
          </div>
        </section>

        <Suspense fallback={null}>
          <Results searchParams={searchParams} />
        </Suspense>

        <Suspense fallback={null}>
          <Picks />
        </Suspense>

        <section id="nasil" className={`${styles.wrap} ${styles.split}`} aria-labelledby="nasil-baslik">
          <div className={styles.splitIntro}>
            <h2 id="nasil-baslik" className={styles.h2}>
              Sipariş nasıl ilerler?
            </h2>
            <p className={styles.lead}>
              Tomurcuk sizi dükkâna götürür; buketi hazırlayan, saati veren ve kapıya getiren çiçekçinin kendisidir.
            </p>
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
        </section>

        <section id="takip" className={styles.wrap} aria-labelledby="takip-baslik">
          <div className={home.lookup}>
            <div className={home.lookupText}>
              <h2 id="takip-baslik" className={home.lookupTitle}>
                Siparişinizi bulun
              </h2>
              <p className={home.lookupNote}>Sipariş numarası onay SMS&apos;inde yazar, T ile başlar. Siparişi verirken yazdığınız telefonla birlikte girin.</p>
            </div>
            <OrderLookup />
          </div>
        </section>

        <section className={home.florists} aria-labelledby="cicekci-baslik">
          <div className={`${styles.wrap} ${home.floristsInner}`}>
            <LogoMark className={home.floristsMark} />
            <div className={home.floristsText}>
              <h2 id="cicekci-baslik" className={styles.h2}>
                Çiçekçi misiniz?
              </h2>
              <p className={home.floristsLead}>
                Kendi sipariş sayfanızı açın; semtinizdeki alıcılar sizi burada bulsun, siparişler tek ekrana düşsün. Sipariş başına komisyon yok.
              </p>
            </div>
            <Link href="/cicekciler" className={`tm-btn ${home.floristsButton}`}>
              Çiçekçiler için
            </Link>
          </div>
        </section>
      </main>

      <footer className={`${styles.wrap} ${styles.footer}`}>
        <span>
          <Logo className={styles.footerLogo} /> Mahallenin çiçekçisinden sipariş.
        </span>
        <span className={styles.footerLinks}>
          <Link href="/cicekciler">Çiçekçiler için</Link>
          <a href="#takip">Siparişimi bul</a>
        </span>
      </footer>
    </>
  );
}

/** Bugün ve yarın, platformun saat dilimine göre. */
function today(): IsoDate {
  return zonedNow(new Date(), PLATFORM_ZONE).date;
}

async function Search({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const areas = await getAreas();
  const now = today();
  const area = parseArea(first(params[SEARCH_PARAMS.area]));
  const day = parseDay(first(params[SEARCH_PARAMS.day]), first(params[SEARCH_PARAMS.date])) ?? now;
  const days = [0, 1].map((offset) => {
    const date = addDays(now, offset);
    return { id: date, label: relativeDayName(date, now), hint: formatDayMonth(date) };
  });
  return (
    <DiscoverForm
      areas={areas}
      days={days}
      lastDay={addDays(now, BOOKING_WINDOW_DAYS - 1)}
      selectedArea={area ? areaValue(area) : ""}
      selectedDay={day}
    />
  );
}

async function Results({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const area = parseArea(first(params[SEARCH_PARAMS.area]));
  const date = parseDay(first(params[SEARCH_PARAMS.day]), first(params[SEARCH_PARAMS.date]));
  if (!area || !date) return null;
  const now = today();
  const offset = daysBetween(now, date);
  const place = area.neighborhood ?? area.district;
  const title = `${offset >= 0 ? dayName(date, now) : formatLongDate(date)} ${withDativeSuffix(place)} teslim eden çiçekçiler`;

  if (offset < 0 || offset >= BOOKING_WINDOW_DAYS) {
    return (
      <section id="sonuc" className={`${styles.wrap} ${home.results}`} aria-labelledby="sonuc-baslik">
        <h2 id="sonuc-baslik" className={styles.h2}>
          {title}
        </h2>
        <p className={home.empty}>Bu tarih için sipariş alınmıyor. Bugünden itibaren {BOOKING_WINDOW_DAYS} gün içinde bir gün seçin.</p>
      </section>
    );
  }

  const shops = await discoverShops({ district: area.district, neighborhood: area.neighborhood, date });
  return (
    <section id="sonuc" className={`${styles.wrap} ${home.results}`} aria-labelledby="sonuc-baslik">
      <div className={home.resultsHead}>
        <h2 id="sonuc-baslik" className={styles.h2}>
          {title}
        </h2>
        <span className={home.resultsMeta}>
          {formatLongDate(date)}, {shops.length} dükkân
        </span>
      </div>
      {shops.length === 0 ? (
        <p className={home.empty}>
          {withDativeSuffix(areaLabel(area))} teslim eden çiçekçi henüz yok. Yakındaki bir semti seçin ya da bu sayfaya yine bakın.
        </p>
      ) : (
        <>
          <ul className={home.shops}>
            {shops.map((shop) => (
              <ShopRow key={shop.slug} shop={shop} area={area} date={date} today={now} />
            ))}
          </ul>
          <p className={home.rankNote}>Sıra, o gün teslim edebilmeye ve ilk müsait saate göredir. Dükkânlar öne çıkmak için ücret ödemez.</p>
        </>
      )}
    </section>
  );
}

const closedText: Record<Exclude<Availability, typeof Availability.Open>, string> = {
  [Availability.SameDayClosed]: "Bugün için siparişler kapandı",
  [Availability.Full]: "Bu gün için yer kalmadı",
  [Availability.Closed]: "Bu gün kapalı",
};

function ShopRow({ shop, area, date, today }: { shop: ShopMatch; area: Area; date: IsoDate; today: IsoDate }) {
  const open = shop.availability === Availability.Open;
  return (
    <li className={home.shop}>
      <div className={home.shopInfo}>
        <h3 className={home.shopName}>
          <Link href={shopPath(shop.slug)}>{shop.name}</Link>
        </h3>
        <p className={home.shopDescription}>{shop.descriptionShort || shop.address}</p>
        <div className={home.shopFacts}>
          {open ? (
            <span className={home.open}>
              {shop.cutoff ? `Bugün ${withTimeSuffix(shop.cutoff, "dative")} kadar sipariş` : `${dayName(date, today)} için sipariş verilebilir`}
            </span>
          ) : (
            <span className={home.closed}>{closedText[shop.availability as keyof typeof closedText]}</span>
          )}
          <span>{shop.deliveryFee === 0 ? "Teslimat ücretsiz" : `Teslimat ${formatPrice(shop.deliveryFee)}`}</span>
          {open && <span>{joinWithAnd(shop.slots.map((s) => formatTimeRange(s.start, s.end)))} müsait</span>}
          {!open && shop.next && (
            <span>
              İlk müsait: {formatDeliveryDay(shop.next.date, today)}, {formatTimeRange(shop.next.start, shop.next.end)}
            </span>
          )}
        </div>
      </div>
      <div className={home.thumbs}>
        {shop.products.map((product) => (
          <Thumb key={product.id} slug={shop.slug} product={product} />
        ))}
      </div>
      {open || !shop.next ? (
        <Button href={shopPath(shop.slug)} variant={open ? "primary" : "secondary"} className={home.shopAction}>
          Dükkânı açın
        </Button>
      ) : (
        <Button href={nextDayHref(area, shop.next.date)} variant="secondary" className={home.shopAction}>
          {daysBetween(today, shop.next.date) === 1 ? "Yarın için bakın" : `${formatDayMonth(shop.next.date)} için bakın`}
        </Button>
      )}
    </li>
  );
}

/** "Yarın" ya da "25 Ekim Pazar". */
const dayName = (date: IsoDate, today: IsoDate) =>
  daysBetween(today, date) <= 1 ? relativeDayName(date, today) : formatLongDate(date);

/** Aynı semtte dükkânın ilk müsait günü. */
const nextDayHref = (area: Area, date: IsoDate) =>
  `/?${new URLSearchParams({ [SEARCH_PARAMS.area]: areaValue(area), [SEARCH_PARAMS.day]: date })}#sonuc`;

const priceLabel = (product: ProductCard) => (product.priceFrom ? formatPriceFrom(product.price) : formatPrice(product.price));

function Thumb({ slug, product }: { slug: string; product: ProductCard }) {
  const photo = renderPhoto(product.photoUrl, "120px");
  return (
    <Link href={productPath(slug, product.id)} className={home.thumb}>
      <span className={home.thumbPhoto}>{photo ?? (
          <span className={home.thumbName} aria-hidden="true">
            {product.name}
          </span>
        )}</span>
      <span className={home.thumbPrice}>
        <span className="visually-hidden">{product.name}, </span>
        {priceLabel(product)}
      </span>
    </Link>
  );
}

async function Picks() {
  // Seçki önbellekten gelir; derlemede API'ye gidilmesin diye istek anında okunur.
  await connection();
  const picks = await getShopPicks();
  if (picks.length === 0) return null;
  return (
    <section className={home.picks} aria-labelledby="secki-baslik">
      <div className={`${styles.wrap} ${home.picksInner}`}>
        <h2 id="secki-baslik" className={styles.h2}>
          Bu hafta çiçekçilerin tezgâhından
        </h2>
        <div className={home.picksGrid}>
          {picks.map((pick) => (
            <ProductItem
              key={`${pick.shopSlug}-${pick.product.id}`}
              href={productPath(pick.shopSlug, pick.product.id)}
              name={pick.product.name}
              summary={pick.shopName}
              price={priceLabel(pick.product)}
              photo={renderPhoto(pick.product.photoUrl, "(min-width: 900px) 25vw, 50vw")}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
