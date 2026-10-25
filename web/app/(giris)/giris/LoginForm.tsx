"use client";

import Link from "next/link";
import { useActionState } from "react";
import { SubmitButton } from "@/components/flow/SubmitButton";
import flow from "@/components/flow/flow.module.css";
import { Field } from "@/components/ui/Field";
import { initialFormState, type FormState } from "@/lib/checkout/form-state";
import { login } from "@/lib/auth/actions";
import styles from "@/components/auth/login.module.css";

export function LoginForm() {
  const [state, action] = useActionState(login, initialFormState);
  return <LoginFields key={state.version} state={state} action={action} />;
}

function LoginFields({ state, action }: { state: FormState; action: (formData: FormData) => void }) {
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
      <Field
        label="Şifre"
        name="password"
        type="password"
        autoComplete="current-password"
        error={state.errors.password}
      />
      <SubmitButton>Giriş yap</SubmitButton>
      <Link href="/sifremi-unuttum" className={styles.altLink}>
        Şifrenizi mi unuttunuz?
      </Link>
    </form>
  );
}
