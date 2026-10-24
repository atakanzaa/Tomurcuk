"use client";

import Link from "next/link";
import { useActionState } from "react";
import { SubmitButton } from "@/components/flow/SubmitButton";
import { Field } from "@/components/ui/Field";
import styles from "@/components/auth/login.module.css";
import { requestResetAction, type ResetRequestState } from "@/lib/onboarding-actions";
import { LOGIN_PATH } from "@/lib/routes";

const initialState: ResetRequestState = { version: 0, error: null, sent: false };

export function ResetRequestForm() {
  const [state, action] = useActionState(requestResetAction, initialState);
  if (state.sent) {
    return (
      <div className={styles.form} role="status">
        <p className={styles.notice}>
          Bu adres bir panel hesabına aitse şifre yenileme bağlantısı gönderdik. E-postanızı kontrol edin; bağlantı 1 saat
          geçerli.
        </p>
        <Link href={LOGIN_PATH} className={styles.altLink}>
          Giriş sayfasına dön
        </Link>
      </div>
    );
  }
  return (
    <form action={action} noValidate className={styles.form} key={state.version}>
      <Field label="E-posta" name="email" type="email" autoComplete="username" inputMode="email" error={state.error ?? undefined} />
      <SubmitButton>Bağlantı gönder</SubmitButton>
      <Link href={LOGIN_PATH} className={styles.altLink}>
        Giriş sayfasına dön
      </Link>
    </form>
  );
}
