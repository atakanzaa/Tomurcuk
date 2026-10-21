import { cx } from "@/lib/cx";
import styles from "./GiftTag.module.css";

export const CARD_NOTE_MAX_LENGTH = 250;

interface GiftTagProps {
  /** Karta yazılacak mesaj, en çok 250 karakter. */
  message: string;
  /** Gönderen adı. İsimsiz gönderimde kullanılmaz. */
  from?: string | null;
  /** İsimsiz gönderimde gönderen adı yerine "İsimsiz gönderim" yazılır. */
  anonymous?: boolean;
  className?: string;
}

/** Kart notu, buketin üstüne asılan kraft etiket olarak. Ekranda en fazla bir tane. */
export function GiftTag({ message, from, anonymous = false, className }: GiftTagProps) {
  const caption = anonymous ? "İsimsiz gönderim" : from;
  return (
    <figure className={cx("tm-gifttag", styles.tag, className)}>
      <p className="tm-gifttag__text">{message}</p>
      {caption && <figcaption className="tm-gifttag__from">{caption}</figcaption>}
    </figure>
  );
}
