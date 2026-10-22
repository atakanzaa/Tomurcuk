"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { whatsappMessageHref } from "@/lib/reminders";
import styles from "../customers.module.css";

/** Hazır mesaj: önizleme, düzenleme ve WhatsApp'ta açma. Gönderimi çiçekçi yapar. */
export function ReminderComposer({ phone, initialMessage, defaultOpen }: { phone: string; initialMessage: string; defaultOpen: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState(initialMessage);

  if (!open) {
    return (
      <Button variant="secondary" size="s" onClick={() => setOpen(true)}>
        Mesaj hazırla
      </Button>
    );
  }
  return (
    <div className={styles.composer}>
      {editing ? (
        <label>
          <span className="visually-hidden">Mesaj</span>
          <textarea className={styles.editor} value={message} onChange={(e) => setMessage(e.target.value)} maxLength={600} />
        </label>
      ) : (
        <p className={styles.composerText}>{message}</p>
      )}
      <div className={styles.composerActions}>
        <Button size="s" href={whatsappMessageHref(phone, message)} target="_blank" rel="noreferrer">
          WhatsApp&apos;ta gönder
        </Button>
        <Button variant="secondary" size="s" onClick={() => setEditing((v) => !v)}>
          {editing ? "Önizle" : "Düzenle"}
        </Button>
      </div>
    </div>
  );
}
