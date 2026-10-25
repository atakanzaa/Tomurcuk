"use client";

import { useActionState, useState } from "react";
import { SubmitButton } from "@/components/flow/SubmitButton";
import { Field } from "@/components/ui/Field";
import { StarMark } from "@/components/ui/Stars";
import { initialFormState } from "@/lib/checkout/form-state";
import { writeReviewAction } from "@/lib/review-actions";
import { REVIEW_TEXT_MAX, ratingWords } from "@/lib/reviews";
import styles from "./review.module.css";

interface ReviewFormProps {
  slug: string;
  token: string;
  shopName: string;
  productName: string;
  /** Yorumun görüneceği ad, ör. "Ayşe D." */
  authorName: string;
}

/** Teslimden sonra takip sayfasında: puan, yorum ve "adım görünmesin". */
export function ReviewForm({ slug, token, shopName, productName, authorName }: ReviewFormProps) {
  const [state, action] = useActionState(writeReviewAction.bind(null, slug, token), initialFormState);
  const [rating, setRating] = useState(Number(state.values.rating) || 0);
  // Gönderimden sonra yıldız seçilince eski hata yerine seçim yazılır.
  const [picked, setPicked] = useState(false);
  const ratingError = picked ? undefined : state.errors.rating;
  const named = authorName !== "Bir alıcı";

  return (
    <form key={state.version} action={action} noValidate aria-labelledby="yorum-baslik" className={styles.form}>
      <div className={styles.head}>
        <h2 id="yorum-baslik" className={styles.title}>
          {productName ? `${productName} nasıldı?` : "Siparişiniz nasıldı?"}
        </h2>
        <p className={styles.help}>
          Yorumunuz ürünün sayfasında ve Tomurcuk&apos;ta, {shopName} tarafından teslim edildiği yazılarak görünür.
        </p>
      </div>
      {state.errors.form && (
        <p className={styles.error} role="alert">
          {state.errors.form}
        </p>
      )}
      {state.errors.order && (
        <p className={styles.error} role="alert">
          {state.errors.order}
        </p>
      )}
      <fieldset className={styles.rating} aria-describedby="puan-metni">
        <legend className={styles.legend}>Puanınız</legend>
        <div className={styles.stars}>
          {[1, 2, 3, 4, 5].map((n) => (
            <label key={n} className={styles.star}>
              <input
                type="radio"
                name="rating"
                value={n}
                className="visually-hidden"
                checked={rating === n}
                onChange={() => {
                  setRating(n);
                  setPicked(true);
                }}
              />
              <StarMark filled={n <= rating} size={32} />
              <span className="visually-hidden">{n} yıldız</span>
            </label>
          ))}
        </div>
        <span id="puan-metni" className={ratingError ? styles.error : styles.muted}>
          {ratingError ?? (rating ? `${rating} / 5: ${ratingWords[rating]}` : "Yıldızlardan birini seçin.")}
        </span>
      </fieldset>
      <Field
        as="textarea"
        label="Yorumunuz"
        name="text"
        optional
        rows={4}
        maxLength={REVIEW_TEXT_MAX}
        defaultValue={state.values.text}
        hint="Kişisel bilgi yazmayın: alıcının adı, adresi, telefonu gibi."
        error={state.errors.text}
      />
      {named && (
        <label className={styles.check}>
          <input type="checkbox" name="hideName" defaultChecked={state.values.hideName === "on"} />
          <span className={styles.checkText}>
            <span>Adım görünmesin</span>
            <span className={styles.muted}>İşaretlemezseniz &quot;{authorName}&quot; olarak görünür.</span>
          </span>
        </label>
      )}
      <SubmitButton>Yorumu gönder</SubmitButton>
      <span className={styles.smallPrint}>Teslimattan sonraki 30 gün içinde, sipariş başına bir yorum.</span>
    </form>
  );
}
