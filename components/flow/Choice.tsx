import type { InputHTMLAttributes, ReactNode } from "react";
import { cx } from "@/lib/cx";
import styles from "./Choice.module.css";

/** Başlıklı seçenek grubu: gerçek <fieldset> ve <legend>. */
export function ChoiceGroup({ legend, children, describedBy }: { legend: ReactNode; children: ReactNode; describedBy?: string }) {
  return (
    <fieldset className={styles.fieldset} aria-describedby={describedBy}>
      <legend className={styles.legend}>{legend}</legend>
      <div className={styles.list}>{children}</div>
    </fieldset>
  );
}

interface ChoiceRowProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "children" | "title"> {
  type: "radio" | "checkbox";
  title: ReactNode;
  /** Başlığın yanında soluk yazılan bilgi: "25 dal". */
  detail?: string | null;
  /** Başlığın altında açıklama satırı. */
  description?: string;
  /** Sağdaki tutar: "1.050 TL" ya da ekler için soluk "+180 TL". */
  trailing?: string;
  trailingMuted?: boolean;
}

/** Satır biçiminde radio ya da checkbox; satırın tamamı etikettir, en az 56px. */
export function ChoiceRow({ type, title, detail, description, trailing, trailingMuted, ...input }: ChoiceRowProps) {
  return (
    <label className={cx(styles.row, description && styles.rowTall)}>
      <input {...input} type={type} className={styles.input} />
      <span className={styles.main}>
        <span>
          {title}
          {detail && <span className={styles.muted}> {detail}</span>}
        </span>
        {description && <span className={styles.description}>{description}</span>}
      </span>
      {trailing && <span className={cx(styles.trailing, trailingMuted && styles.trailingMuted)}>{trailing}</span>}
    </label>
  );
}
