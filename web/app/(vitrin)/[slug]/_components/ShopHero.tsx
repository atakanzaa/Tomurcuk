import { Suspense } from "react";
import { renderPhoto } from "@/components/ProductPhoto";
import { StarMark } from "@/components/ui/Stars";
import type { Rating, Shop } from "@/lib/api/types";
import { cx } from "@/lib/cx";
import { withAblativeSuffix } from "@/lib/format";
import { formatRating, reviewCountLabel } from "@/lib/reviews";
import { DeliveryBand, LiveDeliveryBand } from "./DeliveryBand";
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
 * Vitrinin girişi: kapak fotoğrafı, logo, ad ve teslimat bandı. Mobilde kapak kenardan kenara
 * üstte, logo kapağın altına taşar; masaüstünde kapak sağda durur.
 */
export function ShopHero({ shop, rating }: { shop: Shop; rating: Rating }) {
  const meta = shopMeta(shop);
  return (
    <section className={cx(container.container, hero.hero, shop.coverPhotoUrl && hero.withCover)}>
      {shop.coverPhotoUrl && (
        <div className={hero.cover}>{renderPhoto(shop.coverPhotoUrl, "(min-width: 1024px) 680px, 100vw")}</div>
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
        <p className={hero.lede}>{shop.descriptionShort}</p>
        <p className={hero.ledeLong}>{shop.description}</p>
        {shop.active ? (
          <Suspense fallback={<DeliveryBand shop={shop} sameDayOpen />}>
            <LiveDeliveryBand shop={shop} />
          </Suspense>
        ) : (
          <DeliveryBand shop={shop} sameDayOpen={false} />
        )}
      </div>
    </section>
  );
}
