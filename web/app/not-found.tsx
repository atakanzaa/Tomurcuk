import type { Metadata } from "next";
import { Logo } from "@/components/ui/Logo";
import styles from "./not-found.module.css";

export const metadata: Metadata = { title: "Sayfa bulunamadı" };

export default function NotFound() {
  return (
    <main className={styles.page}>
      <Logo href="/" className={styles.logo} />
      <h1 className={styles.title}>Bu adreste bir sayfa yok</h1>
      <p className={styles.text}>Linki aldığınız yerden adresi kontrol edin.</p>
    </main>
  );
}
