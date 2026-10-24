"use client";

import { X } from "@phosphor-icons/react";
import { useActionState, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import type { IsoDate, Places, SlotSetting, ZoneSetting } from "@/lib/api/types";
import { cx } from "@/lib/cx";
import { formatLongDate } from "@/lib/dates";
import { initialNotice } from "@/lib/panel/notice";
import { parseLira, toLira } from "@/lib/panel/products";
import {
  addClosedDayForm,
  removeClosedDayAction,
  saveCutoffForm,
  saveSlotsForm,
  saveZonesForm,
  type SettingsFormState,
} from "@/lib/panel/settings-actions";
import { Toast } from "../_components/Toast";
import styles from "../_components/settings.module.css";

const initialState: SettingsFormState = { version: 0, errors: {}, values: {}, notice: initialNotice };

let rowKey = 0;
const nextKey = () => `yeni-${++rowKey}`;

/** 06:00–23:30, yarım saat arayla. Tarayıcının saat kutusu işletim sisteminin diline göre 12 saatli görünebilir. */
const TIMES = Array.from({ length: 36 }, (_, i) => {
  const minutes = 6 * 60 + i * 30;
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${minutes % 60 ? "30" : "00"}`;
});

function TimeSelect({ value, onChange, name, label }: { value?: string; onChange?: (v: string) => void; name?: string; label: string }) {
  const options = value && !TIMES.includes(value) ? [value, ...TIMES].sort() : TIMES;
  return (
    <label className="tm-field">
      <span className="tm-field__label">{label}</span>
      <select
        className="tm-field__control"
        name={name}
        {...(onChange ? { value, onChange: (e) => onChange(e.target.value) } : { defaultValue: value })}
      >
        {!value && <option value="">Seçin</option>}
        {options.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>
    </label>
  );
}

function SaveButton({ pending, readOnly, children }: { pending: boolean; readOnly: boolean; children: string }) {
  if (readOnly) return null;
  return (
    <div className={styles.actions}>
      <Button type="submit" disabled={pending} aria-busy={pending || undefined}>
        {children}
      </Button>
    </div>
  );
}

export function CutoffForm({ cutoff, readOnly }: { cutoff: string; readOnly: boolean }) {
  const [state, action, pending] = useActionState(saveCutoffForm, initialState);
  return (
    <form action={action} className={styles.section} aria-labelledby="ayni-gun">
      <div className={styles.sectionHead}>
        <h2 id="ayni-gun" className={styles.sectionTitle}>
          Aynı gün teslim
        </h2>
        <p className={styles.sectionHelp}>Bu saatten sonra gelen siparişler için alıcı ertesi günü ya da daha sonrasını seçer.</p>
      </div>
      <fieldset disabled={readOnly || pending} className={styles.plain}>
        <div className={styles.inline} key={state.version}>
          <TimeSelect label="Son sipariş saati" name="sameDayCutoff" value={state.values.sameDayCutoff ?? cutoff} />
          {!readOnly && (
            <Button type="submit" variant="secondary" disabled={pending}>
              Kaydet
            </Button>
          )}
        </div>
      </fieldset>
      <Toast notice={state.notice} />
    </form>
  );
}

type SlotRow = { key: string; id: string | null; start: string; end: string; capacity: string };

interface EditorState {
  state: SettingsFormState;
  action: (formData: FormData) => void;
  pending: boolean;
}

/**
 * Satırlar istemcide tutulur. Kayıttan sonra sunucudan gelen liste (yeni satırların kimlikleriyle)
 * farklıysa düzenleyici yeniden kurulur; bildirim durumu dışarıda kaldığı için kaybolmaz.
 */
export function SlotsForm({ slots, readOnly }: { slots: SlotSetting[]; readOnly: boolean }) {
  const [state, action, pending] = useActionState(saveSlotsForm, initialState);
  const signature = slots.map((s) => `${s.id}:${s.start}-${s.end}:${s.capacity}`).join("|");
  return <SlotsEditor key={signature} slots={slots} readOnly={readOnly} state={state} action={action} pending={pending} />;
}

function SlotsEditor({ slots, readOnly, state, action, pending }: { slots: SlotSetting[]; readOnly: boolean } & EditorState) {
  const [rows, setRows] = useState<SlotRow[]>(() =>
    slots.map((s) => ({ key: s.id ?? nextKey(), id: s.id, start: s.start, end: s.end, capacity: String(s.capacity ?? "") })),
  );
  const update = (key: string, patch: Partial<SlotRow>) => setRows((all) => all.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  const payload: SlotSetting[] = rows.map((r) => ({
    id: r.id,
    start: r.start,
    end: r.end,
    capacity: r.capacity.trim() === "" ? null : Number(r.capacity),
  }));
  return (
    <form action={action} className={styles.section} aria-labelledby="araliklar">
      <div className={styles.sectionHead}>
        <h2 id="araliklar" className={styles.sectionTitle}>
          Saat aralıkları
        </h2>
        <p className={styles.sectionHelp}>
          Alıcı teslim saatini bu aralıklardan seçer. Kapasite, bir aralığa en çok kaç sipariş alacağınızdır; düşürürseniz alınmış
          siparişler yerinde kalır.
        </p>
      </div>
      <input type="hidden" name="payload" value={JSON.stringify(payload)} />
      <fieldset disabled={readOnly || pending} className={styles.plain}>
        <div className={styles.rows}>
          {rows.map((row, i) => (
            <div key={row.key} className={styles.slotRow}>
              <TimeSelect label="Başlangıç" value={row.start} onChange={(start) => update(row.key, { start })} />
              <TimeSelect label="Bitiş" value={row.end} onChange={(end) => update(row.key, { end })} />
              <label className="tm-field">
                <span className="tm-field__label">Kapasite</span>
                <input
                  className="tm-field__control"
                  inputMode="numeric"
                  value={row.capacity}
                  onChange={(e) => update(row.key, { capacity: e.target.value.replace(/\D/g, "") })}
                />
              </label>
              {!readOnly && (
                <button
                  type="button"
                  className={styles.iconButton}
                  aria-label={`${row.start && row.end ? `${row.start}–${row.end}` : `${i + 1}. aralık`}: kaldır`}
                  onClick={() => setRows((all) => all.filter((r) => r.key !== row.key))}
                >
                  <X size={20} aria-hidden="true" />
                </button>
              )}
            </div>
          ))}
        </div>
        {state.errors.slots && <p className={styles.fieldError}>{state.errors.slots}</p>}
        {!readOnly && (
          <button
            type="button"
            className={cx("tm-btn tm-btn--quiet", styles.addRow)}
            onClick={() => setRows((all) => [...all, { key: nextKey(), id: null, start: "", end: "", capacity: "4" }])}
          >
            Aralık ekle
          </button>
        )}
        <SaveButton pending={pending} readOnly={readOnly}>
          Aralıkları kaydet
        </SaveButton>
      </fieldset>
      <Toast notice={state.notice} />
    </form>
  );
}

type ZoneRow = { key: string; id: string | null; district: string; neighborhood: string; fee: string };

export function ZonesForm({ zones, places, readOnly }: { zones: ZoneSetting[]; places: Places; readOnly: boolean }) {
  const [state, action, pending] = useActionState(saveZonesForm, initialState);
  const signature = zones.map((z) => `${z.id}:${z.district}:${z.neighborhood}:${z.fee}`).join("|");
  return <ZonesEditor key={signature} zones={zones} places={places} readOnly={readOnly} state={state} action={action} pending={pending} />;
}

function ZonesEditor({
  zones,
  places,
  readOnly,
  state,
  action,
  pending,
}: { zones: ZoneSetting[]; places: Places; readOnly: boolean } & EditorState) {
  const [rows, setRows] = useState<ZoneRow[]>(() =>
    zones.map((z) => ({
      key: z.id ?? nextKey(),
      id: z.id,
      district: z.district,
      neighborhood: z.neighborhood ?? "",
      fee: z.fee === null ? "" : toLira(z.fee),
    })),
  );
  // Kayıtlı ama listede olmayan eski mahalle adı seçenek olarak kalır; değiştirilince listeden seçilir.
  const saved = new Map(zones.map((z) => [z.id, z]));
  const update = (key: string, patch: Partial<ZoneRow>) => setRows((all) => all.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  const districts = Object.keys(places);
  const payload: ZoneSetting[] = rows.map((r) => ({
    id: r.id,
    district: r.district,
    neighborhood: r.neighborhood || null,
    fee: parseLira(r.fee),
  }));
  return (
    <form action={action} className={styles.section} aria-labelledby="bolgeler">
      <div className={styles.sectionHead}>
        <h2 id="bolgeler" className={styles.sectionTitle}>
          Teslim bölgeleri
        </h2>
        <p className={styles.sectionHelp}>
          Yalnızca bu bölgelerdeki adreslere sipariş verilebilir. Mahalle seçmezseniz ilçenin tamamına teslim edersiniz; aynı ilçede
          mahalleye özel ücret de yazabilirsiniz.
        </p>
      </div>
      <input type="hidden" name="payload" value={JSON.stringify(payload)} />
      <fieldset disabled={readOnly || pending} className={styles.plain}>
        <div className={styles.rows}>
          {rows.map((row, i) => {
            const legacy = row.id && saved.get(row.id)?.neighborhood;
            const neighborhoods = places[row.district] ?? [];
            return (
              <div key={row.key} className={styles.zoneRow}>
                <label className="tm-field">
                  <span className="tm-field__label">İlçe</span>
                  <select
                    className="tm-field__control"
                    value={row.district}
                    onChange={(e) => update(row.key, { district: e.target.value, neighborhood: "" })}
                  >
                    <option value="">İlçe seçin</option>
                    {districts.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="tm-field">
                  <span className="tm-field__label">Mahalle</span>
                  <select className="tm-field__control" value={row.neighborhood} onChange={(e) => update(row.key, { neighborhood: e.target.value })}>
                    <option value="">Bütün mahalleler</option>
                    {legacy && !neighborhoods.includes(legacy) && <option value={legacy}>{legacy}</option>}
                    {neighborhoods.map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="tm-field">
                  <span className="tm-field__label">Ücret</span>
                  <span className={styles.suffix}>
                    <input className="tm-field__control" inputMode="decimal" value={row.fee} onChange={(e) => update(row.key, { fee: e.target.value })} />
                    <span aria-hidden="true">TL</span>
                  </span>
                </label>
                {!readOnly && (
                  <button
                    type="button"
                    className={styles.iconButton}
                    aria-label={`${row.neighborhood || row.district || `${i + 1}. bölge`}: kaldır`}
                    onClick={() => setRows((all) => all.filter((r) => r.key !== row.key))}
                  >
                    <X size={20} aria-hidden="true" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
        {state.errors.zones && <p className={styles.fieldError}>{state.errors.zones}</p>}
        {!readOnly && (
          <button
            type="button"
            className={cx("tm-btn tm-btn--quiet", styles.addRow)}
            onClick={() => setRows((all) => [...all, { key: nextKey(), id: null, district: "", neighborhood: "", fee: "" }])}
          >
            Bölge ekle
          </button>
        )}
        <SaveButton pending={pending} readOnly={readOnly}>
          Bölgeleri kaydet
        </SaveButton>
      </fieldset>
      <Toast notice={state.notice} />
    </form>
  );
}

interface ClosedDaysProps {
  days: { date: IsoDate; reserved: number }[];
  today: IsoDate;
  readOnly: boolean;
}

export function ClosedDaysForm({ days, today, readOnly }: ClosedDaysProps) {
  const [state, action, pending] = useActionState(addClosedDayForm, initialState);
  return (
    <section className={styles.section} aria-labelledby="kapali">
      <div className={styles.sectionHead}>
        <h2 id="kapali" className={styles.sectionTitle}>
          Kapalı günler
        </h2>
        <p className={styles.sectionHelp}>Tatil ya da izin günü ekleyin; o güne sipariş alınmaz. Önceden alınmış siparişler yerinde kalır.</p>
      </div>
      {days.length === 0 ? (
        <p className={styles.muted}>Kapalı gün yok.</p>
      ) : (
        <ul className={styles.days}>
          {days.map((d) => (
            <li key={d.date} className={styles.day}>
              <span className={styles.dayText}>
                <span className={styles.dayName}>{formatLongDate(d.date)}</span>
                {d.reserved > 0 && <span className={styles.muted}>O güne alınmış {d.reserved} sipariş var</span>}
              </span>
              {!readOnly && (
                <form action={removeClosedDayAction}>
                  <input type="hidden" name="date" value={d.date} />
                  <Button type="submit" variant="quiet" size="s">
                    Kaldır
                  </Button>
                </form>
              )}
            </li>
          ))}
        </ul>
      )}
      {!readOnly && (
        <form action={action} className={styles.inline} key={state.version}>
          <Field label="Tarih" name="date" type="date" min={today} defaultValue={state.values.date} error={state.errors.date} />
          <Button type="submit" variant="secondary" disabled={pending}>
            Kapalı gün ekle
          </Button>
        </form>
      )}
      <Toast notice={state.notice} />
    </section>
  );
}
