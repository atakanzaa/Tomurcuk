"use client";

import { Minus, Plus, Trash } from "@phosphor-icons/react";
import { useActionState, useEffect, useState } from "react";
import { ActionBar } from "@/components/flow/ActionBar";
import { SubmitButton } from "@/components/flow/SubmitButton";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { SlotGroup } from "@/components/ui/TimeSlot";
import { OrderSource, type DeliveryDay, type DeliveryZone, type TimeSlot } from "@/lib/api/types";
import { initialFormState, type FormState } from "@/lib/checkout/form-state";
import { formatDayMonth, relativeDayName } from "@/lib/dates";
import { formatPrice, formatShortTimeRange } from "@/lib/format";
import { orderSourceName } from "@/lib/order";
import { saveManualOrder } from "@/lib/panel/actions";
import { normalizePhone } from "@/lib/phone";
import { detectZone } from "@/lib/zones";
import styles from "./newOrder.module.css";

export interface ProductChoice {
  value: string;
  productId: string;
  sizeName: string | null;
  label: string;
  price: number;
}

interface FoundCustomer {
  name: string;
  orderCount: number;
  lastOrderAt: string | null;
  lastOrder: {
    summary: string;
    items: { productId: string; optionName: string | null; quantity: number }[];
    recipientName: string;
    recipientPhone: string;
    address: string;
  } | null;
}

interface NewOrderFormProps {
  choices: ProductChoice[];
  zones: DeliveryZone[];
  days: DeliveryDay[];
  slots: TimeSlot[];
}

const SOURCES = [OrderSource.Phone, OrderSource.WhatsApp, OrderSource.Instagram, OrderSource.Store, OrderSource.CicekSepeti];
const PAYMENTS = [
  { id: "paid", label: "Ödendi" },
  { id: "cash", label: "Kapıda" },
  { id: "transfer", label: "Havale" },
];
const EXACT = "exact";
const OTHER_DAY = "baska-gun";

export function NewOrderForm(props: NewOrderFormProps) {
  const [state, action] = useActionState(saveManualOrder, initialFormState);
  return <OrderFields key={state.version} {...props} state={state} action={action} />;
}

let rowKey = 0;
const newRow = (value: string, quantity = 1) => ({ key: ++rowKey, value, quantity });

function OrderFields({ choices, zones, days, slots, state, action }: NewOrderFormProps & { state: FormState; action: (fd: FormData) => void }) {
  const sent = (key: string, fallback = "") => state.values[key] ?? fallback;
  const today = days[0]?.date ?? "";

  const [phone, setPhone] = useState(sent("customerPhone"));
  const [customer, setCustomer] = useState<FoundCustomer | null>(null);
  const [lookedUp, setLookedUp] = useState(false);
  const [rows, setRows] = useState(() => [newRow(sent("product", choices[0]?.value ?? ""))]);
  const [date, setDate] = useState(sent("date", today));
  const [slotId, setSlotId] = useState<string | null>(state.values.slotId || null);
  const [recipientName, setRecipientName] = useState(sent("recipientName"));
  const [recipientPhone, setRecipientPhone] = useState(sent("recipientPhone"));
  const [address, setAddress] = useState(sent("address"));

  // Telefon tamamlanınca müşteri kartı aranır; yazmaya devam ederken istek atılmaz.
  useEffect(() => {
    const normalized = normalizePhone(phone);
    if (!normalized) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(`/panel/musteri-ara?telefon=${normalized}`, { signal: controller.signal });
        setCustomer(response.ok ? await response.json() : null);
        setLookedUp(true);
      } catch {
        // İstek iptal edildiyse yeni numara aranıyordur.
      }
    }, 300);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [phone]);
  const phoneComplete = Boolean(normalizePhone(phone));

  const copyLastOrder = () => {
    const last = customer?.lastOrder;
    if (!last) return;
    const copied = last.items
      .map((i) => choices.find((c) => c.productId === i.productId && (c.sizeName ?? null) === i.optionName) ?? choices.find((c) => c.productId === i.productId))
      .filter((c): c is ProductChoice => Boolean(c))
      .map((c, i) => newRow(c.value, last.items[i]?.quantity ?? 1));
    if (copied.length) setRows(copied);
    setRecipientName(last.recipientName);
    setRecipientPhone(last.recipientPhone);
    setAddress(last.address);
  };

  const quickDays = days.slice(0, 2);
  const isQuick = quickDays.some((d) => d.date === date);
  const day = days.find((d) => d.date === date);
  const slotOptions = [
    ...(day?.slots ?? []).map((s) => {
      const slot = slots.find((t) => t.id === s.slotId);
      return { id: s.slotId, label: slot ? formatShortTimeRange(slot.start, slot.end) : s.slotId, hint: "", disabled: s.remaining <= 0 };
    }),
    { id: EXACT, label: "Kesin saat", hint: "" },
  ];
  const changeDay = (next: string) => {
    setDate(next);
    const nextDay = days.find((d) => d.date === next);
    if (slotId !== EXACT && !nextDay?.slots.some((s) => s.slotId === slotId && s.remaining > 0)) setSlotId(null);
  };

  const zone = detectZone(zones, address);
  const subtotal = rows.reduce((sum, r) => sum + (choices.find((c) => c.value === r.value)?.price ?? 0) * r.quantity, 0);
  const total = subtotal + (zone?.fee ?? 0);
  const lastOrderDay = customer?.lastOrderAt ? relativeDayName(customer.lastOrderAt.slice(0, 10), today) : null;

  return (
    <form action={action} noValidate className={styles.form}>
      <section className={styles.sec}>
        <h2 id="kaynak" className={styles.secTitle}>
          Nereden geldi?
        </h2>
        <SlotGroup
          labelledBy="kaynak"
          variant="chip"
          name="source"
          defaultValue={sent("source", OrderSource.Phone)}
          options={SOURCES.map((s) => ({ id: s, label: orderSourceName[s], hint: "" }))}
        />
        {state.errors.source && <p className={styles.error}>{state.errors.source}</p>}
      </section>

      <section className={styles.sec}>
        <Field
          label="Sipariş verenin telefonu"
          name="customerPhone"
          type="tel"
          inputMode="tel"
          autoComplete="off"
          value={phone}
          onChange={(e) => {
            setPhone(e.target.value);
            setLookedUp(false);
          }}
          error={state.errors.customerPhone}
        />
        {phoneComplete && customer && (
          <div className={styles.customerCard} aria-live="polite">
            <div className={styles.customerText}>
              <span className={styles.customerName}>{customer.name}</span>
              <span className={styles.muted}>
                {customer.orderCount} sipariş
                {lastOrderDay && `, en son ${["Bugün", "Dün"].includes(lastOrderDay) ? lastOrderDay.toLocaleLowerCase("tr") : formatDayMonth(customer.lastOrderAt!.slice(0, 10))}`}
              </span>
            </div>
            {customer.lastOrder && (
              <Button variant="secondary" size="s" onClick={copyLastOrder}>
                Son siparişi kopyala
              </Button>
            )}
          </div>
        )}
        {phoneComplete && lookedUp && !customer && (
          <Field label="Sipariş verenin adı" name="customerName" defaultValue={sent("customerName")} hint="Bu numarayla kayıt yok; yeni müşteri kartı açılır." />
        )}
      </section>

      <section className={styles.sec} aria-labelledby="urun-baslik">
        <h2 id="urun-baslik" className={styles.secTitle}>
          Ürün
        </h2>
        {rows.map((row, index) => (
          <div key={row.key} className={styles.itemRow}>
            <Field
              as="select"
              label={rows.length > 1 ? `Ürün ${index + 1}` : "Ürün"}
              name="product"
              value={row.value}
              onChange={(e) => setRows((rs) => rs.map((r) => (r.key === row.key ? { ...r, value: e.target.value } : r)))}
            >
              {choices.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </Field>
            <input type="hidden" name="quantity" value={row.quantity} />
            <div className={styles.stepper} role="group" aria-label={`Adet: ${row.quantity}`}>
              <button
                type="button"
                className={styles.stepButton}
                aria-label="Azalt"
                disabled={row.quantity <= 1}
                onClick={() => setRows((rs) => rs.map((r) => (r.key === row.key ? { ...r, quantity: r.quantity - 1 } : r)))}
              >
                <Minus size={16} aria-hidden="true" />
              </button>
              <span className={styles.qty} aria-hidden="true">
                {row.quantity}
              </span>
              <button
                type="button"
                className={styles.stepButton}
                aria-label="Arttır"
                disabled={row.quantity >= 20}
                onClick={() => setRows((rs) => rs.map((r) => (r.key === row.key ? { ...r, quantity: r.quantity + 1 } : r)))}
              >
                <Plus size={16} aria-hidden="true" />
              </button>
            </div>
            {rows.length > 1 && (
              <button type="button" className={styles.remove} aria-label={`Ürün ${index + 1}'i çıkar`} onClick={() => setRows((rs) => rs.filter((r) => r.key !== row.key))}>
                <Trash size={20} aria-hidden="true" />
              </button>
            )}
          </div>
        ))}
        {state.errors.items && <p className={styles.error}>{state.errors.items}</p>}
        <div className={styles.itemsFoot}>
          <Button variant="quiet" size="s" onClick={() => setRows((rs) => [...rs, newRow(choices[0]?.value ?? "")])}>
            Ürün ekle
          </Button>
          <span className={styles.subtotal}>{formatPrice(subtotal)}</span>
        </div>
      </section>

      <section className={styles.sec}>
        <h2 id="teslim-gun" className={styles.secTitle}>
          Teslim
        </h2>
        <SlotGroup
          labelledBy="teslim-gun"
          variant="chip"
          value={isQuick ? date : OTHER_DAY}
          onChange={(id) => changeDay(id === OTHER_DAY ? (days[2]?.date ?? date) : id)}
          options={[...quickDays.map((d) => ({ id: d.date, label: relativeDayName(d.date, today), hint: "" })), { id: OTHER_DAY, label: "Tarih seç", hint: "" }]}
        />
        {!isQuick && (
          <Field label="Tarih" type="date" value={date} min={today} onChange={(e) => e.target.value && changeDay(e.target.value)} />
        )}
        <input type="hidden" name="date" value={date} />
        {state.errors.date && <p className={styles.error}>{state.errors.date}</p>}
        <span id="teslim-saat" className="visually-hidden">
          Teslim saati
        </span>
        <SlotGroup labelledBy="teslim-saat" variant="chip" name="slotId" value={slotId} onChange={setSlotId} options={slotOptions} />
        {state.errors.slotId && <p className={styles.error}>{state.errors.slotId}</p>}
        {slotId === EXACT && (
          <Field label="Kesin saat" name="exactTime" type="time" defaultValue={sent("exactTime")} error={state.errors.exactTime} />
        )}
        <div className={styles.pair}>
          <Field label="Alıcı" name="recipientName" value={recipientName} onChange={(e) => setRecipientName(e.target.value)} error={state.errors.recipientName} />
          <Field
            label="Alıcının telefonu"
            name="recipientPhone"
            type="tel"
            inputMode="tel"
            value={recipientPhone}
            onChange={(e) => setRecipientPhone(e.target.value)}
            error={state.errors.recipientPhone}
          />
        </div>
        <Field
          label="Adres"
          name="address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          error={state.errors.address}
          hint={
            zone
              ? `${zone.neighborhood ?? zone.district} teslim bölgenizde. Teslimat ${formatPrice(zone.fee)}.`
              : address.trim()
                ? "Adreste teslim bölgelerinizden bir mahalle geçmiyor."
                : "Mahalle adını yazın; teslimat ücreti kendiliğinden eklenir."
          }
        />
        <Field label="Kart notu" name="cardNote" optional maxLength={250} defaultValue={sent("cardNote")} error={state.errors.cardNote} />
      </section>

      <section className={styles.sec}>
        <h2 id="odeme-durumu" className={styles.secTitle}>
          Ödeme
        </h2>
        <SlotGroup
          labelledBy="odeme-durumu"
          variant="segment"
          name="payment"
          defaultValue={sent("payment", "cash")}
          options={PAYMENTS.map((p) => ({ ...p, hint: "" }))}
        />
        {state.errors.payment && <p className={styles.error}>{state.errors.payment}</p>}
      </section>

      <ActionBar total={formatPrice(total)} action={<SubmitButton>Siparişi kaydet</SubmitButton>} aboveTabBar />
    </form>
  );
}
