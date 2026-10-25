import type { Metadata } from "next";
import { Suspense } from "react";
import { Stars } from "@/components/ui/Stars";
import { getPanelReviews } from "@/lib/api";
import { formatRating, formatReviewDate } from "@/lib/reviews";
import panel from "../_components/panel.module.css";
import styles from "../_components/simple.module.css";
import reviews from "./reviews.module.css";

export const metadata: Metadata = { title: "Yorumlar" };

/**
 * Alıcıların yorumları. Dükkân okur; silemez, gizleyemez. Uygunsuz yorumu Tomurcuk ekibi gerekçeyle
 * gizler; gizlenen yorum burada gerekçesiyle kalır.
 */
export default function ReviewsPage() {
  return (
    <>
      <header className={panel.pageHead}>
        <div className={panel.pageHeadText}>
          <span className={panel.eyebrow}>Alıcıların yorumları</span>
          <h1 className={panel.pageTitle}>Yorumlar</h1>
        </div>
      </header>
      <div className={panel.section}>
        <Suspense>
          <ReviewList />
        </Suspense>
      </div>
    </>
  );
}

async function ReviewList() {
  const list = await getPanelReviews();
  if (list.length === 0) {
    return (
      <p className={styles.muted}>
        Henüz yorum yok. Siparişi teslim alan gönderen, takip sayfasından 30 gün içinde yorum yazabilir.
      </p>
    );
  }
  const visible = list.filter((r) => !r.hiddenAt);
  const average = visible.length ? visible.reduce((sum, r) => sum + r.rating, 0) / visible.length : 0;
  return (
    <>
      {visible.length > 0 && (
        <p className={reviews.summary}>
          <Stars rating={average} />
          <strong>{formatRating(average)}</strong>
          <span className={styles.muted}>
            {visible.length} yorum. Vitrininizde ve ürün sayfalarında görünüyor.
          </span>
        </p>
      )}
      <ul className={styles.list}>
        {list.map((review) => (
          <li key={review.id} className={reviews.row}>
            <span className={reviews.head}>
              <Stars rating={review.rating} size={14} />
              <span className={styles.muted}>
                {review.orderNumber}, {review.authorName}, {formatReviewDate(review.createdAt)}
              </span>
            </span>
            {review.products.length > 0 && (
              <span className={styles.strong}>{review.products.map((p) => p.productName).join(", ")}</span>
            )}
            {review.text && <p className={reviews.text}>{review.text}</p>}
            {review.hiddenAt && (
              <span className={reviews.hidden}>
                Tomurcuk ekibi gizledi: {review.hiddenReason}. Bu yorum vitrinde görünmüyor.
              </span>
            )}
          </li>
        ))}
      </ul>
    </>
  );
}
