"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { lookupOrder } from "@/lib/checkout/actions";
import { initialFormState } from "@/lib/checkout/form-state";
import { phoneHref } from "@/lib/format";
import { SubmitButton } from "../_components/flow/SubmitButton";
import flow from "../_components/flow/flow.module.css";

export function LookupForm({ slug, phone }: { slug: string; phone: string }) {
  const [state, action] = useActionState(lookupOrder.bind(null, slug), initialFormState);
  return (
    <form key={state.version} action={action} noValidate className={flow.body}>
      <div className={flow.section}>
        <h1 className={flow.title}>Siparişim nerede?</h1>
        <p className={flow.note}>
          Sipariş verdiğinizde takip linkini SMS ile gönderdik. Linki bulamıyorsanız sipariş numaranızı ve
          telefonunuzu yazın.
        </p>
      </div>
      {state.errors.form && (
        <p className={flow.formError} role="alert">
          {state.errors.form}
        </p>
      )}
      <div className={flow.sectionLoose}>
        <Field
          label="Sipariş numarası"
          name="number"
          placeholder="T-4821"
          autoComplete="off"
          defaultValue={state.values.number}
          error={state.errors.number}
        />
        <Field
          label="Telefonunuz"
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          defaultValue={state.values.phone}
          hint="Siparişi verirken yazdığınız numara."
          error={state.errors.phone}
        />
        <SubmitButton>Siparişi bul</SubmitButton>
        <Button variant="quiet" href={phoneHref(phone)}>
          Dükkânı arayın
        </Button>
      </div>
    </form>
  );
}
