import type { Metadata } from "next";
import styles from "@/components/auth/login.module.css";
import { SupportLoginForm } from "./SupportLoginForm";

export const metadata: Metadata = {
  title: "Destek girişi · Tomurcuk",
  robots: { index: false, follow: false },
};

/** Destek ekibinin girişi: şifreye ek olarak doğrulama uygulamasındaki kod (iki adımlı). */
export default function SupportLoginPage() {
  return (
    <main className={styles.page}>
      <div className={styles.column}>
        <p className={styles.brand}>Tomurcuk Destek</p>
        <h1 className={styles.title}>Destek paneline giriş</h1>
        <p className={styles.lede}>
          E-posta adresiniz, şifreniz ve doğrulama uygulamanızdaki 6 haneli kodla giriş yapın.
        </p>
        <SupportLoginForm />
      </div>
    </main>
  );
}
