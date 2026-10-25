import { Stars } from "@/components/ui/Stars";
import type { ProductReviews, Review, Shop } from "@/lib/api/types";
import { formatRating, formatReviewDate, reviewCountLabel } from "@/lib/reviews";
import styles from "./reviews.module.css";

/** İlk bu kadarı açık; kalanı "Bütün yorumlar"ın altında. */
const VISIBLE = 4;

/** Ürün sayfasında puan ve yorumlar; her yorumda hangi dükkândan teslim edildiği yazar. */
export function ProductReviewList({ shop, reviews }: { shop: Shop; reviews: ProductReviews }) {
  const { rating } = reviews;
  const first = reviews.reviews.slice(0, VISIBLE);
  const rest = reviews.reviews.slice(VISIBLE);
  return (
    <section id="yorumlar" aria-labelledby="yorumlar-baslik" className={styles.section}>
      <h2 id="yorumlar-baslik" className={styles.heading}>
        Yorumlar
      </h2>
      {rating.count === 0 ? (
        <p className={styles.muted}>Bu ürüne henüz yorum yazılmadı. Yorumu siparişi teslim alanlar yazar.</p>
      ) : (
        <>
          <div className={styles.summary}>
            <span className={styles.average}>{formatRating(rating.average)}</span>
            <span className={styles.summaryText}>
              <Stars rating={rating.average} />
              <span className={styles.muted}>
                {reviewCountLabel(rating)}. Yalnızca siparişi teslim alanlar yazabilir.
              </span>
            </span>
          </div>
          <ul className={styles.list}>
            {first.map((review) => (
              <ReviewItem key={review.id} review={review} shopName={shop.name} />
            ))}
          </ul>
          {rest.length > 0 && (
            <details className={styles.more}>
              <summary className={styles.moreToggle}>Bütün yorumlar ({reviews.reviews.length})</summary>
              <ul className={styles.list}>
                {rest.map((review) => (
                  <ReviewItem key={review.id} review={review} shopName={shop.name} />
                ))}
              </ul>
            </details>
          )}
        </>
      )}
    </section>
  );
}

function ReviewItem({ review, shopName }: { review: Review; shopName: string }) {
  return (
    <li className={styles.item}>
      <div className={styles.itemHead}>
        <span className={styles.author}>{review.authorName}</span>
        <Stars rating={review.rating} size={14} />
      </div>
      {review.text && <p className={styles.text}>{review.text}</p>}
      <span className={styles.meta}>
        {formatReviewDate(review.createdAt)}. Teslim eden: {shopName}
      </span>
    </li>
  );
}
