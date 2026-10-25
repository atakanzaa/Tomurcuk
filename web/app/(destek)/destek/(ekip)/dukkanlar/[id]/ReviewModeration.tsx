"use client";

import { useActionState, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Stars } from "@/components/ui/Stars";
import type { Review } from "@/lib/api/types";
import { initialFormState } from "@/lib/checkout/form-state";
import { formatReviewDate } from "@/lib/reviews";
import { hideReviewAction } from "@/lib/review-actions";
import support from "../../_components/support.module.css";
import dialog from "../../_components/dialog.module.css";
import styles from "./overview.module.css";

/**
 * Dükkânın en yeni yorumları; destek ekibinin her rolü gerekçeyle gizler. Gizlenen yorum
 * vitrinden düşer, dükkân panelinde "Gizlendi" olarak kalır.
 */
export function ReviewModeration({ shopId, reviews }: { shopId: string; reviews: Review[] }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [target, setTarget] = useState<Review | null>(null);
  const [state, action, pending] = useActionState(async (prev: typeof initialFormState, formData: FormData) => {
    if (!target) return prev;
    const next = await hideReviewAction(shopId, target.id, prev, formData);
    if (next.values.done) dialogRef.current?.close();
    return next;
  }, initialFormState);

  if (reviews.length === 0) return <p className={support.empty}>Henüz yorum yok.</p>;
  return (
    <>
      <ul className={styles.reviews}>
        {reviews.map((review) => (
          <li key={review.id} className={styles.reviewRow}>
            <div className={styles.reviewText}>
              <span className={styles.reviewHead}>
                <Stars rating={review.rating} size={14} />
                <span className={support.small}>
                  {review.orderNumber}, {review.authorName}, {formatReviewDate(review.createdAt)}
                  {review.products.length > 0 && `, ${review.products.map((p) => p.productName).join(", ")}`}
                </span>
              </span>
              {review.text ? <span>{review.text}</span> : <span className={support.small}>Yalnızca puan</span>}
              {review.hiddenAt && <span className={styles.reviewHidden}>Gizlendi: {review.hiddenReason}</span>}
            </div>
            {!review.hiddenAt && (
              <Button
                variant="secondary"
                size="s"
                onClick={() => {
                  setTarget(review);
                  dialogRef.current?.showModal();
                }}
              >
                Gizle
              </Button>
            )}
          </li>
        ))}
      </ul>
      <dialog ref={dialogRef} className={dialog.dialog} aria-labelledby="yorum-gizle-baslik">
        <form key={`${state.version}-${target?.id}`} action={action} className={dialog.dialogForm} noValidate>
          <h2 id="yorum-gizle-baslik" className={dialog.dialogTitle}>
            Yorumu gizle
          </h2>
          <p className={dialog.dialogText}>
            Yorum vitrinden, ürün sayfasından ve alıcı ana sayfasından kalkar; silinmez. Dükkân panelinde gerekçesiyle
            görünür.
          </p>
          {target?.text && <blockquote className={styles.reviewQuote}>{target.text}</blockquote>}
          {state.errors.form && (
            <p className={styles.statusError} role="alert">
              {state.errors.form}
            </p>
          )}
          <Field
            as="textarea"
            label="Gerekçe"
            name="reason"
            hint="Denetim kaydında ve dükkânın panelinde görünür."
            defaultValue={state.values.reason}
            error={state.errors.reason}
            maxLength={500}
          />
          <div className={dialog.dialogActions}>
            <Button variant="secondary" onClick={() => dialogRef.current?.close()}>
              Vazgeç
            </Button>
            <Button type="submit" disabled={pending}>
              Yorumu gizle
            </Button>
          </div>
        </form>
      </dialog>
    </>
  );
}
