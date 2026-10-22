"use client";

import { useActionState, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import type { CannedReply } from "@/lib/api/types";
import { initialFormState } from "@/lib/checkout/form-state";
import { sendReply } from "@/lib/support-actions";
import styles from "./ticket.module.css";

/** Dükkâna yanıt, dahili not ya da "yanıtla, dükkânı bekle". Hazır cevap metni alana eklenir. */
export function ReplyForm({ ticketId, canned }: { ticketId: string; canned: CannedReply[] }) {
  const [state, action] = useActionState(sendReply.bind(null, ticketId), initialFormState);
  return <ReplyFields key={state.version} state={state} action={action} canned={canned} />;
}

function ReplyFields({ state, action, canned }: { state: typeof initialFormState; action: (fd: FormData) => void; canned: CannedReply[] }) {
  const [text, setText] = useState(state.values.done ? "" : (state.values.text ?? ""));
  const menuRef = useRef<HTMLDetailsElement>(null);

  return (
    <form action={action} className={styles.reply} noValidate>
      <Field as="textarea" label="Dükkâna yanıt" name="text" value={text} onChange={(e) => setText(e.target.value)} error={state.errors.text} />
      <div className={styles.replyBar}>
        <div className={styles.buttons}>
          <details ref={menuRef} className={styles.canned}>
            <summary className={`tm-btn tm-btn--secondary tm-btn--s ${styles.cannedSummary}`}>Hazır cevap</summary>
            <div className={styles.cannedPanel}>
              {canned.map((reply) => (
                <button
                  key={reply.id}
                  type="button"
                  className={styles.cannedItem}
                  onClick={() => {
                    setText(reply.text);
                    if (menuRef.current) menuRef.current.open = false;
                  }}
                >
                  <b>{reply.title}</b>
                  {reply.text.slice(0, 70)}…
                </button>
              ))}
            </div>
          </details>
          <Button type="submit" variant="secondary" size="s" name="mode" value="internal">
            Dahili not olarak ekle
          </Button>
        </div>
        <div className={styles.buttons}>
          <Button type="submit" variant="secondary" size="s" name="mode" value="wait">
            Yanıtla, dükkânı bekle
          </Button>
          <Button type="submit" size="s" name="mode" value="reply">
            Yanıtla
          </Button>
        </div>
      </div>
      {state.values.done && (
        <p className={styles.done} role="status">
          {state.values.done}
        </p>
      )}
    </form>
  );
}
