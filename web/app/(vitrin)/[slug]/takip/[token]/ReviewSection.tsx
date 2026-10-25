import { Stars } from "@/components/ui/Stars";
import { getReviewState } from "@/lib/api";
import type { Shop } from "@/lib/api/types";
import { formatReviewDate } from "@/lib/reviews";
import { ReviewForm } from "./ReviewForm";
import styles from "./review.module.css";

/**
 * Teslim edilen siparişte yorum formu; yazıldıysa yorumun kendisi. Teslim edilmeyen ya da
 * süresi geçen siparişte bölüm görünmez.
 */
export async function ReviewSection({ shop, token }: { shop: Shop; token: string }) {
  const state = await getReviewState(shop.id, token);
  if (!state) return null;
  if (state.review) {
    const review = state.review;
    return (
      <section aria-labelledby="yorumunuz" className={styles.done}>
        <div className={styles.doneHead}>
          <h2 id="yorumunuz" className={styles.title}>
            Yorumunuz
          </h2>
          <Stars rating={review.rating} />
        </div>
        {review.text && <p className={styles.doneText}>{review.text}</p>}
        <span className={styles.muted}>
          {review.hiddenAt
            ? "Bu yorum Tomurcuk ekibi tarafından gizlendi."
            : `${formatReviewDate(review.createdAt)}, ${review.authorName} adıyla ürünün sayfasında görünüyor.`}
        </span>
      </section>
    );
  }
  if (!state.canWrite) return null;
  return (
    <ReviewForm
      slug={shop.slug}
      token={token}
      shopName={shop.name}
      productName={state.productName}
      authorName={state.authorName}
    />
  );
}
