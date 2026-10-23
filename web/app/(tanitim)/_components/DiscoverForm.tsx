"use client";

import Form from "next/form";
import { useState } from "react";
import { SlotGroup } from "@/components/ui/TimeSlot";
import type { Area, IsoDate } from "@/lib/api/types";
import { areaLabel, areaValue, OTHER_DAY, SEARCH_PARAMS } from "@/lib/discover";
import styles from "../home.module.css";

interface DayOption {
  id: IsoDate;
  label: string;
  hint: string;
}

interface DiscoverFormProps {
  areas: Area[];
  /** Bugün ve yarın; "Başka gün" takvimi bunlardan sonrası içindir. */
  days: DayOption[];
  lastDay: IsoDate;
  selectedArea: string;
  selectedDay: IsoDate;
}

/**
 * Semt ve gün seçimi. GET ile gönderilir; seçim adreste kalır, sonuç sayfası paylaşılabilir ve
 * JavaScript olmadan da çalışır (gün seçimi yalnızca o zaman "Bugün"de kalır).
 */
export function DiscoverForm({ areas, days, lastDay, selectedArea, selectedDay }: DiscoverFormProps) {
  const preset = days.some((d) => d.id === selectedDay);
  const [day, setDay] = useState<string>(preset ? selectedDay : OTHER_DAY);
  const options = [...days, { id: OTHER_DAY, label: "Başka gün", hint: "Takvimden" }];

  return (
    <Form action="/" className={styles.search} aria-label="Çiçekçi ara">
      <label className="tm-field">
        <span className="tm-field__label">Nereye gönderiyorsunuz?</span>
        <select className="tm-field__control" name={SEARCH_PARAMS.area} defaultValue={selectedArea} required>
          <option value="" disabled>
            Semt seçin
          </option>
          {areas.map((area) => (
            <option key={areaValue(area)} value={areaValue(area)}>
              {areaLabel(area)}
            </option>
          ))}
        </select>
      </label>
      <div className={styles.dayField}>
        <span className="tm-field__label" id="gun-etiketi">
          Ne zaman?
        </span>
        <SlotGroup labelledBy="gun-etiketi" options={options} value={day} onChange={setDay} name={SEARCH_PARAMS.day} stretch />
        {day === OTHER_DAY && (
          <label className="tm-field">
            <span className="tm-field__label">Teslim günü</span>
            <input
              className="tm-field__control"
              type="date"
              name={SEARCH_PARAMS.date}
              min={days[0].id}
              max={lastDay}
              defaultValue={preset ? days[days.length - 1].id : selectedDay}
              required
            />
          </label>
        )}
      </div>
      <button type="submit" className={`tm-btn tm-btn--primary tm-btn--block ${styles.searchButton}`}>
        Çiçekçileri göster
      </button>
    </Form>
  );
}
