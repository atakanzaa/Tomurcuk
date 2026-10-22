import type { Metadata } from "next";
import { LoginForm } from "./LoginForm";
import styles from "./login.module.css";

export const metadata: Metadata = {
  title: "Panele giriş · Tomurcuk",
  robots: { index: false, follow: false },
};

/** Satıcı paneli girişi. Tasarımda ayrı ekranı yok; design system kurallarıyla sade tutuldu. */
export default function LoginPage() {
  return (
    <main className={styles.page}>
      <div className={styles.column}>
        <p className={styles.brand}>Tomurcuk</p>
        <h1 className={styles.title}>Panele giriş</h1>
        <p className={styles.lede}>Dükkânınızın siparişlerini görmek için e-posta adresiniz ve şifrenizle giriş yapın.</p>
        <LoginForm />
      </div>
    </main>
  );
}
