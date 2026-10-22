import { CaretLeft } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import type { ReactNode } from "react";
import styles from "./FlowHeader.module.css";

interface FlowHeaderProps {
  back: { href: string; label: string };
  /** Sağdaki alan: adım bilgisi, paylaş butonu ya da sipariş numarası. */
  aside?: ReactNode;
  /** Sipariş adımlarında 1–3 arası ilerleme. */
  step?: number;
}

const STEP_COUNT = 3;

export function FlowHeader({ back, aside, step }: FlowHeaderProps) {
  return (
    <>
      <header className={styles.header}>
        <Link href={back.href} className={styles.back}>
          <CaretLeft size={20} aria-hidden="true" />
          {back.label}
        </Link>
        {step ? (
          <span className={styles.aside}>
            Adım {step} / {STEP_COUNT}
          </span>
        ) : (
          aside
        )}
      </header>
      {step && (
        <ol className={styles.progress} aria-hidden="true">
          {Array.from({ length: STEP_COUNT }, (_, i) => (
            <li key={i} className={styles.bar} data-done={i < step} />
          ))}
        </ol>
      )}
    </>
  );
}

export function FlowAside({ children }: { children: ReactNode }) {
  return <span className={styles.aside}>{children}</span>;
}
