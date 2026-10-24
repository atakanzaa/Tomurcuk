import type { Metadata } from "next";
import { LoginShell } from "@/components/auth/LoginShell";
import styles from "@/components/auth/login.module.css";
import { ResetRequestForm } from "./ResetRequestForm";

export const metadata: Metadata = { title: "Şifrenizi yenileyin · Tomurcuk", robots: { index: false, follow: false } };

/** Giriş ekranındaki "Şifrenizi mi unuttunuz?": e-postaya 1 saat geçerli bağlantı gider. */
export default function ForgotPasswordPage() {
  return (
    <LoginShell aside="Bugünün siparişleri, müşteri defteriniz ve teslimat saatleriniz tek ekranda.">
      <h1 className={styles.title}>Şifrenizi yenileyin</h1>
      <p className={styles.lede}>Panele girdiğiniz e-posta adresini yazın; şifrenizi yenilemeniz için bir bağlantı gönderelim.</p>
      <ResetRequestForm />
    </LoginShell>
  );
}
