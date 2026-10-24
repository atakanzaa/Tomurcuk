"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import type { SpecialDay } from "@/lib/api/types";
import { removeSpecialDay, saveSpecialDayForm, type SpecialDayFormState } from "@/lib/panel/actions";
import { initialNotice } from "@/lib/panel/notice";
import { Toast } from "../../_components/Toast";
import styles from "../customers.module.css";

/** Siparişten açılınca formu dolduran değerler. */
export interface SpecialDayDraft {
  day: number;
  month: number;
  recipientName: string;
}

interface SpecialDaysProps {
  customerId: string;
  days: SpecialDay[];
  /** Sipariş detayındaki "Özel gün olarak kaydet" ile gelindiyse ekleme formu açık ve dolu gelir. */
  draft: SpecialDayDraft | null;
}

const initialState: SpecialDayFormState = { version: 0, errors: {}, values: {}, notice: initialNotice, saved: 0 };

const monthName = new Intl.DateTimeFormat("tr", { month: "long", timeZone: "UTC" });
const MONTHS = Array.from({ length: 12 }, (_, i) => monthName.format(Date.UTC(2000, i, 1)));
/** Ayın gün sayısı; 2000 artık yıl olduğu için Şubat 29 (hatırlatma artık yıl olmayan yılda 28'inde gelir). */
const daysInMonth = (month: number) => new Date(Date.UTC(2000, month, 0)).getUTCDate();

/** "12 Mart"; yıl tutulmaz. */
const dayLabel = (d: { day: number; month: number }) => `${d.day} ${MONTHS[d.month - 1]}`;

/** Gün listesi seçili ayın gün sayısı kadar; ay değişince olmayan gün ayın son gününe çekilir. */
function DateSelects({ day: initialDay, month: initialMonth }: { day: number; month: number }) {
  const [month, setMonth] = useState(initialMonth);
  const [day, setDay] = useState(Math.min(initialDay, daysInMonth(initialMonth)));
  return (
    <div className={styles.dateFields}>
      <Field as="select" label="Gün" name="day" value={day} onChange={(e) => setDay(Number(e.target.value))}>
        {Array.from({ length: daysInMonth(month) }, (_, i) => (
          <option key={i + 1} value={i + 1}>
            {i + 1}
          </option>
        ))}
      </Field>
      <Field
        as="select"
        label="Ay"
        name="month"
        value={month}
        onChange={(e) => {
          const next = Number(e.target.value);
          setMonth(next);
          setDay((d) => Math.min(d, daysInMonth(next)));
        }}
      >
        {MONTHS.map((m, i) => (
          <option key={m} value={i + 1}>
            {m}
          </option>
        ))}
      </Field>
    </div>
  );
}

/** Müşteri kartındaki özel günler: satır satır liste, yerinde düzenleme, altta ekleme. */
export function SpecialDays({ customerId, days, draft }: SpecialDaysProps) {
  const [editing, setEditing] = useState<string | null>(draft ? "new" : null);
  const [state, action, pending] = useActionState(async (prev: SpecialDayFormState, formData: FormData) => {
    const next = await saveSpecialDayForm(prev, formData);
    if (next.saved !== prev.saved) setEditing(null);
    return next;
  }, initialState);
  const [removed, removeAction] = useActionState(async (prev: typeof initialNotice, formData: FormData) => {
    const next = await removeSpecialDay(prev, formData);
    if (!next.error) setEditing(null);
    return next;
  }, initialNotice);

  const form = (day: SpecialDay | null) => {
    const values = state.values;
    const start = day ?? (draft ? { title: "", ...draft } : null);
    const v = (key: string, fallback: string | number | null | undefined) => values[key] ?? String(fallback ?? "");
    return (
      <div className={styles.dayForm}>
        <form action={action} key={state.version} className={styles.dayFields}>
          <input type="hidden" name="customerId" value={customerId} />
          <input type="hidden" name="dayId" value={day?.id ?? ""} />
          <Field
            label="Ne günü"
            name="title"
            placeholder="Annesinin doğum günü"
            defaultValue={v("title", start?.title)}
            maxLength={160}
            error={state.errors.title}
          />
          <DateSelects day={Number(v("day", start?.day ?? 1))} month={Number(v("month", start?.month ?? 1))} />
          <Field
            label="Kime"
            name="recipientName"
            optional
            hint="Çiçeği alacak kişi; hatırlatmada görünür."
            defaultValue={v("recipientName", start?.recipientName)}
            maxLength={120}
            error={state.errors.recipientName}
          />
          <div className={styles.dayActions}>
            <Button type="submit" disabled={pending}>
              {day ? "Kaydet" : "Özel günü ekle"}
            </Button>
            <Button variant="secondary" onClick={() => setEditing(null)}>
              Vazgeç
            </Button>
          </div>
        </form>
        {day && (
          <form action={removeAction}>
            <input type="hidden" name="customerId" value={customerId} />
            <input type="hidden" name="dayId" value={day.id} />
            <Button type="submit" variant="quiet" size="s" className={styles.dayDelete}>
              Özel günü sil
            </Button>
          </form>
        )}
      </div>
    );
  };

  return (
    <>
      {days.length === 0 && editing !== "new" && (
        <p className={styles.muted}>Kayıtlı özel gün yok. Doğum günü ya da yıl dönümü ekleyin; tarihi yaklaşınca hatırlatmalarda görünür.</p>
      )}
      {days.length > 0 && (
        <ul className={styles.list}>
          {days.map((d) =>
            editing === d.id ? (
              <li key={d.id} className={styles.dayEditRow}>
                {form(d)}
              </li>
            ) : (
              <li key={d.id} className={styles.row}>
                <span className={styles.reminderText}>
                  <span className={styles.what}>{d.title}</span>
                  {d.recipientName && <span className={styles.muted}>{d.recipientName}</span>}
                </span>
                <span className={styles.daySide}>
                  <span className={styles.side}>{dayLabel(d)}</span>
                  <button type="button" className={styles.dayEdit} onClick={() => setEditing(d.id)} aria-label={`${d.title}, düzenle`}>
                    Düzenle
                  </button>
                </span>
              </li>
            ),
          )}
        </ul>
      )}
      {editing === "new" ? (
        form(null)
      ) : (
        <div>
          <Button variant="secondary" size="s" onClick={() => setEditing("new")}>
            Özel gün ekle
          </Button>
        </div>
      )}
      <Toast notice={state.notice} />
      <Toast notice={removed} />
    </>
  );
}
