"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import styles from "./TimeSlot.module.css";

export interface TimeSlotOption {
  id: string;
  /** "13:00–16:00" */
  label: string;
  /** Kalan yer; 0 ise aralık dolu. */
  remaining: number;
}

interface TimeSlotProps {
  /** Grubun görünür etiketinin id'si. */
  labelledBy: string;
  options: TimeSlotOption[];
  /** Kontrollü kullanım için seçili aralık. */
  value?: string | null;
  defaultValue?: string | null;
  onChange?: (id: string) => void;
  /** Form gönderiminde seçili aralığı taşıyan gizli alanın adı. */
  name?: string;
  /** Aynı gün son saati geçtiyse tüm aralıklar yerine tek satırda gösterilen mesaj. */
  closedMessage?: string;
}

/** Kalan yer 3 ve altına düşünce sayıyla yazılır; dolu aralık gizlenmez. */
export function slotAvailabilityText(remaining: number): string {
  if (remaining <= 0) return "Dolu";
  if (remaining <= 3) return `${remaining} yer kaldı`;
  return "Müsait";
}

/**
 * Teslim saati seçimi. ARIA radio grubu: grupta tek sekme durağı vardır, ok tuşları
 * müsait aralıklar arasında gezinir ve seçer; dolu aralıklar atlanır.
 */
export function TimeSlot({
  labelledBy,
  options,
  value,
  defaultValue = null,
  onChange,
  name,
  closedMessage,
}: TimeSlotProps) {
  const [internal, setInternal] = useState<string | null>(defaultValue);
  const selected = value !== undefined ? value : internal;
  const refs = useRef(new Map<string, HTMLButtonElement>());

  if (closedMessage) {
    return (
      <p className={styles.closed}>
        {closedMessage}
        <small>{options.map((o) => o.label).join(", ")}</small>
      </p>
    );
  }

  const available = options.filter((o) => o.remaining > 0);
  const focusable = available.some((o) => o.id === selected) ? selected : (available[0]?.id ?? null);

  const select = (id: string) => {
    if (value === undefined) setInternal(id);
    onChange?.(id);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, id: string) => {
    const index = available.findIndex((o) => o.id === id);
    const last = available.length - 1;
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
    const next = available[target];
    select(next.id);
    refs.current.get(next.id)?.focus();
  };

  return (
    <div className="tm-slots" role="radiogroup" aria-labelledby={labelledBy}>
      {options.map((option) => {
        const full = option.remaining <= 0;
        const checked = option.id === selected;
        return (
          <button
            key={option.id}
            ref={(node) => {
              if (node) refs.current.set(option.id, node);
              else refs.current.delete(option.id);
            }}
            type="button"
            role="radio"
            className="tm-slot"
            aria-checked={checked}
            aria-disabled={full || undefined}
            tabIndex={option.id === focusable ? 0 : -1}
            onClick={full ? undefined : () => select(option.id)}
            onKeyDown={full ? undefined : (event) => onKeyDown(event, option.id)}
          >
            {option.label}
            <small>{slotAvailabilityText(option.remaining)}</small>
          </button>
        );
      })}
      {name && <input type="hidden" name={name} value={selected ?? ""} />}
    </div>
  );
}
