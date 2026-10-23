import type { Metadata } from "next";
import { LoginShell } from "@/components/auth/LoginShell";
import { LoginForm } from "./LoginForm";
import styles from "@/components/auth/login.module.css";

export const metadata: Metadata = {
  title: "Panele giriş · Tomurcuk",
  robots: { index: false, follow: false },
};

/** Satıcı paneli girişi. Tasarımda ayrı ekranı yok; design system kurallarıyla sade tutuldu. */
export default function LoginPage() {
  return (
    <LoginShell aside="Bugünün siparişleri, müşteri defteriniz ve teslimat saatleriniz tek ekranda.">
      <h1 className={styles.title}>Panele giriş</h1>
      <p className={styles.lede}>Dükkânınızın siparişlerini görmek için e-posta adresiniz ve şifrenizle giriş yapın.</p>
      <LoginForm />
    </LoginShell>
  );
}
