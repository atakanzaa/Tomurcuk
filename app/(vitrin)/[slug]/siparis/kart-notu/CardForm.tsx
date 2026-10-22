"use client";

import { useActionState, useState } from "react";
import { Field } from "@/components/ui/Field";
import { CARD_NOTE_MAX_LENGTH, GiftTag } from "@/components/ui/GiftTag";
import type { OrderDraft } from "@/lib/api/types";
import { submitCard } from "@/lib/checkout/actions";
import { initialFormState, type FormState } from "@/lib/checkout/form-state";
import { cx } from "@/lib/cx";
import { formatPrice } from "@/lib/format";
import { ActionBar } from "@/components/flow/ActionBar";
import { SubmitButton } from "@/components/flow/SubmitButton";
import flow from "@/components/flow/flow.module.css";
import styles from "./card.module.css";

const QUICK_MESSAGES = ["İyi ki doğdun", "Geçmiş olsun", "Nice yıllara"];

export function CardForm({ slug, draft }: { slug: string; draft: OrderDraft }) {
  const [state, action] = useActionState(submitCard.bind(null, slug), initialFormState);
  return <CardFields key={state.version} draft={draft} state={state} action={action} />;
}

function CardFields({
  draft,
  state,
  action,
}: {
  draft: OrderDraft;
  state: FormState;
  action: (formData: FormData) => void;
}) {
  const saved = draft.card;
  const sent = (key: string) => state.values[key];
  const [message, setMessage] = useState(sent("message") ?? saved?.message ?? "");
  const [signature, setSignature] = useState(sent("signature") ?? saved?.signature ?? "");
  const [anonymous, setAnonymous] = useState(
    state.version > 0 ? sent("anonymous") === "on" : (saved?.anonymous ?? false),
  );

  return (
    <form action={action} noValidate>
      <div className={flow.body}>
        <h1 className={flow.title}>Karta ne yazalım?</h1>
        {state.errors.form && (
          <p className={flow.formError} role="alert">
            {state.errors.form}
          </p>
        )}

        {/* Canlı önizleme; aynı metin aşağıdaki alanda olduğu için ekran okuyuculardan gizli. */}
        <div className={cx(styles.preview, !message && styles.placeholder)} aria-hidden="true">
          <GiftTag message={message || "Mesajınız burada görünür."} from={signature} anonymous={anonymous} />
          <svg className={styles.thread} viewBox="0 0 358 236" preserveAspectRatio="xMinYMin slice">
            <path
              d="M96 0 C 84 60, 62 100, 54 148"
              style={{ fill: "none", stroke: "var(--kraft-deep)", strokeWidth: 1.75, strokeLinecap: "round" }}
            />
            <circle cx="54" cy="148" r="2.5" style={{ fill: "var(--kraft-deep)" }} />
          </svg>
        </div>

        <section className={flow.sectionLoose}>
          <Field
            as="textarea"
            label="Mesajınız"
            name="message"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            maxLength={CARD_NOTE_MAX_LENGTH}
            hint="Çiçekçi elle yazıp buketin üstüne asar."
            error={state.errors.message}
          />
          <div className={styles.messages} role="group" aria-label="Hazır mesajlar">
            {QUICK_MESSAGES.map((text) => (
              <button key={text} type="button" className={styles.messageChip} onClick={() => setMessage(text)}>
                {text}
              </button>
            ))}
          </div>

          <Field
            label="Kartta görünecek isim"
            name="signature"
            value={anonymous ? "" : signature}
            onChange={(event) => setSignature(event.target.value)}
            disabled={anonymous}
            hint={anonymous ? "İsimsiz gönderimde kartta isim yazmaz." : undefined}
            error={state.errors.signature}
          />
          <label className={styles.check}>
            <input
              type="checkbox"
              name="anonymous"
              checked={anonymous}
              onChange={(event) => setAnonymous(event.target.checked)}
            />
            <span className={styles.checkText}>
              <span>İsimsiz gönder</span>
              <span className={styles.checkHint}>Kartta ve alıcıya giden mesajlarda adınız yazmaz.</span>
            </span>
          </label>

          <Field
            label="Sizin telefonunuz"
            name="senderPhone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            defaultValue={sent("senderPhone") ?? saved?.senderPhone ?? ""}
            hint="Sipariş yola çıkınca ve teslim edilince SMS göndeririz."
            error={state.errors.senderPhone}
          />
        </section>
      </div>
      <ActionBar total={formatPrice(draft.total)} action={<SubmitButton>Ödemeye geç</SubmitButton>} />
    </form>
  );
}
