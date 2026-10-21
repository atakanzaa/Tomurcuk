"use client";

import { useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { cx } from "@/lib/cx";
import styles from "./TimeSlot.module.css";

export interface SlotOption {
  id: string;
  /** Üst satır: "13:00–16:00", "Yarın" ya da ikon. */
  label: ReactNode;
  /** Alt satır (small): "3 yer kaldı", "22 Ekim". */
  hint: string;
  disabled?: boolean;
  /** Etiket yalnızca ikon olduğunda erişilebilir ad. */
  ariaLabel?: string;
}

interface SlotGroupProps {
  /** Grubun görünür başlığının id'si. */
  labelledBy: string;
  options: SlotOption[];
  /** Kontrollü kullanım için seçili seçenek. */
  value?: string | null;
  defaultValue?: string | null;
  onChange?: (id: string) => void;
  /** Form gönderiminde seçimi taşıyan gizli alanın adı. */
  name?: string;
  /** Seçenekler satırı eşit paylaşır. */
  stretch?: boolean;
  /** Hata mesajının id'si. */
  describedBy?: string;
}

/**
 * tm-slot görünümünde tek seçimli grup (ARIA radio). Grupta tek sekme durağı vardır;
 * ok tuşları, Home ve End seçilebilir seçenekler arasında gezinip seçer.
 */
export function SlotGroup({
  labelledBy,
  options,
  value,
  defaultValue = null,
  onChange,
  name,
  stretch,
  describedBy,
}: SlotGroupProps) {
  const [internal, setInternal] = useState<string | null>(defaultValue);
  const selected = value !== undefined ? value : internal;
  const refs = useRef(new Map<string, HTMLButtonElement>());

  const enabled = options.filter((o) => !o.disabled);
  const focusable = enabled.some((o) => o.id === selected) ? selected : (enabled[0]?.id ?? null);

  const select = (id: string) => {
    if (value === undefined) setInternal(id);
    onChange?.(id);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, id: string) => {
    const index = enabled.findIndex((o) => o.id === id);
    const last = enabled.length - 1;
    const target = {
      ArrowRight: index === last ? 0 : index + 1,
      ArrowDown: index === last ? 0 : index + 1,
      ArrowLeft: index === 0 ? last : index - 1,
      ArrowUp: index === 0 ? last : index - 1,
      Home: 0,
      End: last,
    }[event.key];
    if (target === undefined || index === -1) return;
    event.preventDefault();
    const next = enabled[target];
    select(next.id);
    refs.current.get(next.id)?.focus();
  };

  return (
    <div
      className={cx("tm-slots", stretch && styles.stretch)}
      role="radiogroup"
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
    >
      {options.map((option) => (
        <button
          key={option.id}
          ref={(node) => {
            if (node) refs.current.set(option.id, node);
            else refs.current.delete(option.id);
          }}
          type="button"
          role="radio"
          className="tm-slot"
          aria-checked={option.id === selected}
          aria-disabled={option.disabled || undefined}
          aria-label={option.ariaLabel}
          tabIndex={option.id === focusable ? 0 : -1}
          onClick={option.disabled ? undefined : () => select(option.id)}
          onKeyDown={option.disabled ? undefined : (event) => onKeyDown(event, option.id)}
        >
          {option.label}
          <small>{option.hint}</small>
        </button>
      ))}
      {name && <input type="hidden" name={name} value={selected ?? ""} />}
    </div>
  );
}

export interface TimeSlotOption {
  id: string;
  /** "13:00–16:00" */
  label: string;
  /** Kalan yer; 0 ise aralık dolu. */
  remaining: number;
}

type TimeSlotProps = Omit<SlotGroupProps, "options"> & {
  options: TimeSlotOption[];
  /** Aynı gün son saati geçtiyse tüm aralıklar yerine tek satırda gösterilen mesaj. */
  closedMessage?: string;
};

/** Kalan yer 3 ve altına düşünce sayıyla yazılır; dolu aralık gizlenmez. */
export function slotAvailabilityText(remaining: number): string {
  if (remaining <= 0) return "Dolu";
  if (remaining <= 3) return `${remaining} yer kaldı`;
  return "Müsait";
}

/** Teslim saati aralığı seçimi; kapasiteyi kelimeyle gösterir. */
export function TimeSlot({ options, closedMessage, ...props }: TimeSlotProps) {
  if (closedMessage) {
    return (
      <p className={styles.closed}>
        {closedMessage}
        <small>{options.map((o) => o.label).join(", ")}</small>
      </p>
    );
  }
  return (
    <SlotGroup
      {...props}
      options={options.map((o) => ({
        id: o.id,
        label: o.label,
        hint: slotAvailabilityText(o.remaining),
        disabled: o.remaining <= 0,
      }))}
    />
  );
}
