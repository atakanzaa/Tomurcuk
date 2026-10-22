"use client";

import { useActionState } from "react";
import styles from "@/components/auth/login.module.css";
import { SubmitButton } from "@/components/flow/SubmitButton";
import flow from "@/components/flow/flow.module.css";
import { Field } from "@/components/ui/Field";
import { supportLogin } from "@/lib/auth/actions";
import { initialFormState, type FormState } from "@/lib/checkout/form-state";

export function SupportLoginForm() {
  const [state, action] = useActionState(supportLogin, initialFormState);
  return <SupportLoginFields key={state.version} state={state} action={action} />;
}

function SupportLoginFields({ state, action }: { state: FormState; action: (formData: FormData) => void }) {
  return (
    <form action={action} noValidate className={styles.form}>
      {state.errors.form && (
        <p className={flow.formError} role="alert">
          {state.errors.form}
        </p>
      )}
      <Field
        label="E-posta"
        name="email"
        type="email"
        autoComplete="username"
        inputMode="email"
        defaultValue={state.values.email}
        error={state.errors.email}
      />
      <Field label="Şifre" name="password" type="password" autoComplete="current-password" error={state.errors.password} />
      <Field
        label="Doğrulama kodu"
        name="code"
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        hint="Doğrulama uygulamanızdaki 6 haneli kod; 30 saniyede bir değişir."
        error={state.errors.code}
      />
      <SubmitButton>Giriş yap</SubmitButton>
    </form>
  );
}
