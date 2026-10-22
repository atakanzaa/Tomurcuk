"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { PaymentMethod } from "@/lib/api/types";
import { submitPayment } from "@/lib/checkout/actions";
import { initialFormState, type FormState } from "@/lib/checkout/form-state";
import { formatPrice } from "@/lib/format";
import { ActionBar } from "@/components/flow/ActionBar";
import { ChoiceGroup, ChoiceRow } from "@/components/flow/Choice";
import { SubmitButton } from "@/components/flow/SubmitButton";
import flow from "@/components/flow/flow.module.css";
import styles from "./payment.module.css";

interface PaymentFormProps {
  slug: string;
  total: number;
  shopName: string;
  /** Sayfa her açıldığında yeni üretilir; aynı formun ikinci gönderimi yeni sipariş açmaz. */
  idempotencyKey: string;
}

export function PaymentForm(props: PaymentFormProps) {
  const [state, action] = useActionState(submitPayment.bind(null, props.slug), initialFormState);
  return <PaymentFields key={state.version} {...props} state={state} action={action} />;
}

function PaymentFields({
  slug,
  total,
  shopName,
  idempotencyKey,
  state,
  action,
}: PaymentFormProps & { state: FormState; action: (formData: FormData) => void }) {
  const [method, setMethod] = useState(state.values.paymentMethod ?? PaymentMethod.Card);

  return (
    <form action={action} noValidate>
      <input type="hidden" name="idempotencyKey" value={idempotencyKey} />
      <div className={flow.body}>
        {state.errors.form && (
          <p className={flow.formError} role="alert">
            {state.errors.form}
          </p>
        )}
        <div className={flow.section}>
          <ChoiceGroup legend="Ödeme yöntemi">
            <ChoiceRow
              type="radio"
              name="paymentMethod"
              value={PaymentMethod.Card}
              checked={method === PaymentMethod.Card}
              onChange={() => setMethod(PaymentMethod.Card)}
              title="Kartla öde"
              description="Kart bilgilerini iyzico'nun güvenli sayfasında girersiniz. Taksit yok."
            />
            <ChoiceRow
              type="radio"
              name="paymentMethod"
              value={PaymentMethod.Transfer}
              checked={method === PaymentMethod.Transfer}
              onChange={() => setMethod(PaymentMethod.Transfer)}
              title="Havale veya EFT"
              description="Sipariş, ödeme dükkânın hesabına geçince hazırlanır."
            />
          </ChoiceGroup>
          {state.errors.paymentMethod && <p className={flow.groupError}>{state.errors.paymentMethod}</p>}
        </div>

        <div className={flow.section}>
          <label className={styles.consent}>
            <input
              type="checkbox"
              name="consent"
              defaultChecked={state.values.consent === "on"}
              aria-invalid={state.errors.consent ? true : undefined}
              aria-describedby={state.errors.consent ? "onay-hata" : undefined}
            />
            <span>
              <Link href={`/${slug}/sozlesmeler/on-bilgilendirme`}>Ön bilgilendirme formunu</Link> ve{" "}
              <Link href={`/${slug}/sozlesmeler/mesafeli-satis`}>mesafeli satış sözleşmesini</Link> okudum,
              onaylıyorum.
            </span>
          </label>
          {state.errors.consent && (
            <p id="onay-hata" className={flow.groupError}>
              {state.errors.consent}
            </p>
          )}
        </div>
      </div>
      <ActionBar
        action={
          <SubmitButton>{method === PaymentMethod.Card ? `${formatPrice(total)} öde` : "Siparişi tamamla"}</SubmitButton>
        }
        caption={`Ödemeyi doğrudan ${shopName} alır.`}
      />
    </form>
  );
}
