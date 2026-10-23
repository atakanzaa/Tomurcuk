import type { ReactNode } from "react";
import { Logo, LogoMark } from "@/components/ui/Logo";
import styles from "./login.module.css";

interface LoginShellProps {
  /** Adın yanındaki not ("Destek"). */
  note?: string;
  /** Masaüstünde kraft yüzde duran tek cümle. */
  aside: string;
  children: ReactNode;
}

/** Giriş ekranlarının ortak düzeni: masaüstünde solda kraft kâğıt üstünde işaret, sağda form. */
export function LoginShell({ note, aside, children }: LoginShellProps) {
  return (
    <main className={styles.page}>
      <div className={styles.side}>
        <LogoMark className={styles.sideMark} />
        <p className={styles.sideText}>{aside}</p>
      </div>
      <div className={styles.content}>
        <div className={styles.column}>
          <Logo href="/" note={note} className={styles.brand} />
          {children}
        </div>
      </div>
    </main>
  );
}
