import { Suspense } from "react";
import { renderPhoto } from "@/components/ProductPhoto";
import { StarMark } from "@/components/ui/Stars";
import { ShopLayout, type Rating, type Shop } from "@/lib/api/types";
import { cx } from "@/lib/cx";
import { withAblativeSuffix } from "@/lib/format";
import { formatRating, reviewCountLabel } from "@/lib/reviews";
import { DeliveryBand, LiveDeliveryBand } from "./DeliveryBand";
import { storyParagraphs } from "./ShopStory";
import container from "./container.module.css";
import hero from "./Hero.module.css";

/** "Caferağa Mah. Moda Cad. No: 41, Kadıköy" → "Kadıköy. 2009'dan beri." */
function shopMeta(shop: Shop): string {
  const district = shop.address.split(",").at(-1)?.trim();
  const since = shop.foundedYear ? `${withAblativeSuffix(String(shop.foundedYear))} beri` : null;
  const parts = [district, since].filter(Boolean);
  return parts.length ? `${parts.join(". ")}.` : "";
}

/**
 * Vitrinin girişi; dükkânın seçtiği düzene göre:
 * - kapak önde: kapak fotoğrafı mobilde kenardan kenara üstte, masaüstünde sağda; logo kapağın altına taşar.
 * - hikâye önde: kapak yok; hikâye ve atölye fotoğrafları girişte.
 * - çiçekler önde: kapak ince bir şerit; giriş kısa, ürünler hemen başlar.
 */
export function ShopHero({ shop, rating }: { shop: Shop; rating: Rating }) {
  const meta = shopMeta(shop);
  const storyFirst = shop.layout === ShopLayout.Story;
  const strip = shop.layout === ShopLayout.Products;
  const showCover = Boolean(shop.coverPhotoUrl) && !storyFirst;
  const paragraphs = storyFirst ? storyParagraphs(shop.story) : [];
  return (
    <section
      className={cx(
        container.container,
        hero.hero,
        showCover && hero.withCover,
        strip && hero.strip,
        storyFirst && hero.storyFirst,
      )}
    >
      {showCover && (
        <div className={hero.cover}>
          {renderPhoto(shop.coverPhotoUrl, strip ? "100vw" : "(min-width: 1024px) 680px, 100vw")}
        </div>
      )}
      <div className={hero.intro}>
        {shop.logoUrl && <div className={hero.logo}>{renderPhoto(shop.logoUrl, "84px")}</div>}
        <h1 className={hero.title}>{shop.name}</h1>
        {meta && <p className={hero.meta}>{meta}</p>}
        {rating.count > 0 && (
          <p className={hero.rating}>
            <StarMark />
            <strong>{formatRating(rating.average)}</strong>
            <span className={hero.ratingCount}>{reviewCountLabel(rating)}</span>
          </p>
        )}
        {storyFirst && paragraphs.length > 0 ? (
          paragraphs.map((paragraph, i) => (
            <p key={i} className={i === 0 ? hero.storyLead : hero.storyText}>
              {paragraph}
            </p>
          ))
        ) : (
          <>
            <p className={hero.lede}>{shop.descriptionShort}</p>
            <p className={hero.ledeLong}>{shop.description}</p>
          </>
        )}
        {shop.active ? (
          <Suspense fallback={<DeliveryBand shop={shop} sameDayOpen />}>
            <LiveDeliveryBand shop={shop} />
          </Suspense>
        ) : (
          <DeliveryBand shop={shop} sameDayOpen={false} />
        )}
      </div>
      {storyFirst && shop.storyPhotos.length > 0 && (
        <div className={hero.storyPhotos}>
          {shop.storyPhotos.map((url) => (
            <div key={url} className={hero.storyPhoto}>
              {renderPhoto(url, "(min-width: 1024px) 220px, 33vw")}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
