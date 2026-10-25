import { cx } from "@/lib/cx";
import { formatRating } from "@/lib/reviews";
import styles from "./Stars.module.css";

const STAR = "M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z";

/** Tek yıldız işareti; dolu ya da boş. Rengi pollen; metin değil, işaret. */
export function StarMark({
  filled = true,
  size = 18,
  className,
}: {
  filled?: boolean;
  size?: number;
  className?: string;
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className={cx(styles.star, className)}>
      <path d={STAR} className={filled ? styles.filled : styles.empty} />
    </svg>
  );
}

/** Beş yıldız; ekran okuyucuya "5 üzerinden 4,8" diye okunur. Yarım yıldız yok, yuvarlanır. */
export function Stars({ rating, size = 18, className }: { rating: number; size?: number; className?: string }) {
  const filled = Math.round(rating);
  return (
    <span role="img" aria-label={`5 üzerinden ${formatRating(rating)}`} className={cx(styles.stars, className)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <StarMark key={n} filled={n <= filled} size={size} />
      ))}
    </span>
  );
}
