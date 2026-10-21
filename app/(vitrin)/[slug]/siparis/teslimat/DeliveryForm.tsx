"use client";

import { CalendarBlank } from "@phosphor-icons/react";
import { useActionState, useState } from "react";
import { Field } from "@/components/ui/Field";
import { SlotGroup, TimeSlot, type SlotOption } from "@/components/ui/TimeSlot";
import type { DeliveryDay, DeliveryZone, OrderDraft, TimeSlot as Slot } from "@/lib/api/types";
import { submitDelivery } from "@/lib/checkout/actions";
import { initialFormState, type FormState } from "@/lib/checkout/form-state";
import { formatDayMonth, relativeDayName } from "@/lib/dates";
import { formatPrice, formatTimeRange } from "@/lib/format";
import { ActionBar } from "@/components/flow/ActionBar";
import { SubmitButton } from "@/components/flow/SubmitButton";
import flow from "@/components/flow/flow.module.css";
import styles from "./delivery.module.css";

interface DeliveryFormProps {
  slug: string;
  draft: OrderDraft;
  days: DeliveryDay[];
  slots: Slot[];
  zones: DeliveryZone[];
}

/** Hızlı seçimde gösterilen gün sayısı; gerisi "Başka gün" ile seçilir. */
const QUICK_DAYS = 3;
const OTHER_DAY = "baska-gun";

export function DeliveryForm(props: DeliveryFormProps) {
  const [state, action] = useActionState(submitDelivery.bind(null, props.slug), initialFormState);
  return <DeliveryFields key={state.version} {...props} state={state} action={action} />;
}

function DeliveryFields({
  draft,
  days,
  slots,
  zones,
  state,
  action,
}: DeliveryFormProps & { state: FormState; action: (formData: FormData) => void }) {
  const saved = draft.delivery;
  const value = (key: string, fallback = "") => state.values[key] ?? fallback;
  const today = days[0]?.date ?? "";

  // Gün: önce gönderilen değer, sonra taslak, sonra ilk uygun gün.
  const firstOpen = days.find((d) => !d.closed && !d.sameDayClosed && d.slots.some((s) => s.remaining > 0));
  const [date, setDate] = useState(value("date", saved?.date ?? firstOpen?.date ?? today));
  const quickDays = days.slice(0, QUICK_DAYS);
  const isQuick = quickDays.some((d) => d.date === date);
  const day = days.find((d) => d.date === date);

  const slotOptions = (day?.slots ?? []).map((s) => {
    const slot = slots.find((t) => t.id === s.slotId);
    return { id: s.slotId, label: slot ? formatTimeRange(slot.start, slot.end) : s.slotId, remaining: s.remaining };
  });
  const [slotId, setSlotId] = useState<string | null>(
    value("slotId", saved?.slotId ?? slotOptions.find((o) => o.remaining > 0)?.id ?? "") || null,
  );
  const slotAvailable = slotOptions.some((o) => o.id === slotId && o.remaining > 0);

  const changeDay = (next: string) => {
    setDate(next);
    // Yeni günde seçili aralık yoksa ya da doluysa ilk müsait aralığa geçilir.
    const nextDay = days.find((d) => d.date === next);
    const stillThere = nextDay?.slots.some((s) => s.slotId === slotId && s.remaining > 0);
    if (!stillThere) setSlotId(nextDay?.slots.find((s) => s.remaining > 0)?.slotId ?? null);
  };

  const districts = [...new Set(zones.map((z) => z.district))];
  const savedZone = zones.find((z) => z.id === value("zoneId", saved?.zoneId ?? ""));
  const [district, setDistrict] = useState(savedZone?.district ?? districts[0] ?? "");
  const districtZones = zones.filter((z) => z.district === district);
  const wholeDistrict = districtZones.find((z) => z.neighborhood === null);
  const [zoneId, setZoneId] = useState(savedZone?.id ?? districtZones[0]?.id ?? "");
  const zone = zones.find((z) => z.id === zoneId);

  const changeDistrict = (next: string) => {
    setDistrict(next);
    setZoneId(zones.find((z) => z.district === next)?.id ?? "");
  };

  const dayOptions: SlotOption[] = [
    ...quickDays.map((d) => ({
      id: d.date,
      label: relativeDayName(d.date, today),
      hint: d.closed ? "Kapalı" : formatDayMonth(d.date),
      disabled: d.closed,
    })),
    {
      id: OTHER_DAY,
      label: <CalendarBlank size={20} aria-hidden="true" />,
      hint: "Başka gün",
      ariaLabel: "Başka bir gün seç",
    },
  ];

  const fee = zone?.fee ?? 0;
  const place = zone?.neighborhood ?? zone?.district ?? "";
  const dateError = state.errors.date;
  const slotError = state.errors.slotId;

  return (
    <form action={action} noValidate>
      <div className={flow.body}>
        <h1 className={flow.title}>Ne zaman, nereye?</h1>
        {state.errors.form && (
          <p className={flow.formError} role="alert">
            {state.errors.form}
          </p>
        )}

        <section className={flow.section}>
          <h2 id="teslim-gunu" className={flow.sectionTitle}>
            Teslim günü
          </h2>
          <SlotGroup
            labelledBy="teslim-gunu"
            options={dayOptions}
            value={isQuick ? date : OTHER_DAY}
            onChange={(id) => changeDay(id === OTHER_DAY ? (days[QUICK_DAYS]?.date ?? date) : id)}
            describedBy={dateError ? "gun-hata" : undefined}
            stretch
          />
          {!isQuick && (
            <Field
              label="Tarih"
              type="date"
              value={date}
              min={today}
              max={days.at(-1)?.date}
              onChange={(event) => event.target.value && changeDay(event.target.value)}
              hint={day?.closed ? "Dükkân bu gün kapalı. Başka bir gün seçin." : "Önümüzdeki iki hafta içinden bir gün seçin."}
            />
          )}
          <input type="hidden" name="date" value={date} />
          {dateError && (
            <p id="gun-hata" className={flow.groupError}>
              {dateError}
            </p>
          )}
        </section>

        <section className={flow.section}>
          <h2 id="saat-araligi" className={flow.sectionTitle}>
            Saat aralığı
          </h2>
          <TimeSlot
            labelledBy="saat-araligi"
            options={slotOptions}
            value={slotAvailable ? slotId : null}
            onChange={setSlotId}
            name="slotId"
            stretch
            describedBy={slotError ? "saat-hata" : undefined}
            closedMessage={
              day?.closed
                ? "Dükkân bu gün kapalı"
                : day?.sameDayClosed || slotOptions.length === 0
                  ? "Bugün için kapandı"
                  : undefined
            }
          />
          {slotError && (
            <p id="saat-hata" className={flow.groupError}>
              {slotError}
            </p>
          )}
        </section>

        <section className={flow.sectionLoose}>
          <h2 className={flow.sectionTitle}>Kime gidiyor?</h2>
          <Field
            label="Alıcının adı"
            name="recipientName"
            defaultValue={value("recipientName", saved?.recipientName)}
            error={state.errors.recipientName}
            autoComplete="off"
          />
          <Field
            label="Alıcının telefonu"
            name="recipientPhone"
            type="tel"
            inputMode="tel"
            autoComplete="off"
            defaultValue={value("recipientPhone", saved?.recipientPhone)}
            hint="Kurye teslimattan önce bu numarayı arar."
            error={state.errors.recipientPhone}
          />
          <div className={flow.pair}>
            <Field as="select" label="İlçe" value={district} onChange={(event) => changeDistrict(event.target.value)}>
              {districts.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </Field>
            {wholeDistrict ? (
              <>
                <input type="hidden" name="zoneId" value={wholeDistrict.id} />
                <Field
                  label="Mahalle"
                  name="neighborhood"
                  defaultValue={value("neighborhood", saved?.zoneId === wholeDistrict.id ? saved.neighborhood : "")}
                  error={state.errors.neighborhood}
                />
              </>
            ) : (
              <Field
                as="select"
                label="Mahalle"
                name="zoneId"
                value={zoneId}
                onChange={(event) => setZoneId(event.target.value)}
                error={state.errors.zoneId}
              >
                {districtZones.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.neighborhood}
                  </option>
                ))}
              </Field>
            )}
          </div>
          <Field
            as="textarea"
            label="Açık adres"
            name="address"
            className={styles.address}
            autoComplete="off"
            defaultValue={value("address", saved?.address)}
            error={state.errors.address}
          />
          <Field
            label="Kuryeye not"
            name="courierNote"
            optional
            placeholder="Ör. zil çalışmıyor, arayın"
            defaultValue={value("courierNote", saved?.courierNote)}
            error={state.errors.courierNote}
          />
        </section>

        {zone && (
          <p className={flow.note} aria-live="polite">
            {place} için teslimat ücreti {formatPrice(fee)}.
          </p>
        )}
      </div>
      <ActionBar total={formatPrice(draft.subtotal + fee)} action={<SubmitButton>Kart notuna geç</SubmitButton>} />
    </form>
  );
}
