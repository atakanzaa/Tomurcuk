"use client";

import { useActionState } from "react";
import { SubmitButton } from "@/components/flow/SubmitButton";
import flow from "@/components/flow/flow.module.css";
import styles from "@/components/auth/login.module.css";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { setPasswordAction, type SetPasswordState } from "@/lib/onboarding-actions";
import { LOGIN_PATH } from "@/lib/routes";

const initialState: SetPasswordState = { version: 0, errors: {}, values: {}, done: false };

export function SetPasswordForm({ token, email }: { token: string; email: string }) {
  const [state, action] = useActionState(setPasswordAction.bind(null, token), initialState);
  if (state.done) {
    return (
      <div className={styles.form} role="status">
        <p className={styles.lede}>Şifreniz kaydedildi. {email} ve yeni şifrenizle giriş yapabilirsiniz.</p>
        <Button href={LOGIN_PATH} block>
          Giriş yap
        </Button>
      </div>
    );
  }
  return (
    <form action={action} noValidate className={styles.form} key={state.version}>
      {state.errors.token && (
        <p className={flow.formError} role="alert">
          {state.errors.token}
        </p>
      )}
      {/* Tarayıcının şifre yöneticisi şifreyi bu hesaba kaydetsin. */}
      <input type="email" name="username" autoComplete="username" value={email} readOnly hidden />
      <Field
        label="Yeni şifre"
        name="password"
        type="password"
        autoComplete="new-password"
        hint="En az 10 karakter. Başka yerde kullanmadığınız bir şifre seçin."
        error={state.errors.password}
      />
      <Field label="Yeni şifre, tekrar" name="confirm" type="password" autoComplete="new-password" error={state.errors.confirm} />
      <SubmitButton>Şifreyi kaydet</SubmitButton>
    </form>
  );
}
