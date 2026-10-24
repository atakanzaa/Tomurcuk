"use client";

import {
  useId,
  useState,
  type ChangeEvent,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { cx } from "@/lib/cx";
import styles from "./Field.module.css";

interface FieldOwnProps {
  label: string;
  /** Alanın altında görünen yardım metni. Hata varken hata metni gösterilir. */
  hint?: ReactNode;
  /** Neyin yanlış olduğunu ve nasıl düzeltileceğini söyleyen metin. */
  error?: string;
  /** Etiketin yanına "(isteğe bağlı)" ekler. Zorunlu alanlar işaretlenmez. */
  optional?: boolean;
  /** Tek satırlı alanda da `maxLength` sayacını gösterir. */
  counter?: boolean;
  className?: string;
}

type InputFieldProps = FieldOwnProps & { as?: "input" } & Omit<InputHTMLAttributes<HTMLInputElement>, "className">;
type TextareaFieldProps = FieldOwnProps & { as: "textarea" } & Omit<
    TextareaHTMLAttributes<HTMLTextAreaElement>,
    "className"
  >;
type SelectFieldProps = FieldOwnProps & { as: "select"; children: ReactNode } & Omit<
    SelectHTMLAttributes<HTMLSelectElement>,
    "className"
  >;

export type FieldProps = InputFieldProps | TextareaFieldProps | SelectFieldProps;

type Control = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

/**
 * Etiket, giriş ve altında yardım ya da hata metni. Etiket girişi sarar, böylece
 * tıklanınca giriş odaklanır. Çok satırlı alanda `maxLength` verilirse sayaç görünür.
 */
export function Field(props: FieldProps) {
  const { label, hint, optional, className } = props;
  const metaId = useId();
  // Kullanıcı alanı düzeltmeye başlayınca eski hata gizlenir, yardım metni geri gelir;
  // form yeniden gönderilince sunucu yeniden doğrular.
  const [editedSinceError, setEditedSinceError] = useState(false);
  const [valueAtError] = useState(props.value);
  const changedElsewhere = props.value !== undefined && props.value !== valueAtError;
  const error = editedSinceError || changedElsewhere ? undefined : props.error;
  const [length, setLength] = useState(() => String(props.value ?? props.defaultValue ?? "").length);

  const maxLength = props.as === "select" ? undefined : props.maxLength;
  const showCount = (props.as === "textarea" || props.counter) && maxLength !== undefined;
  const count = props.value !== undefined ? String(props.value).length : length;
  const message = error ?? hint;
  const hasMeta = Boolean(message) || showCount;

  const controlProps = {
    className: cx("tm-field__control", styles.control, props.as === "select" && styles.select),
    "aria-invalid": error ? true : undefined,
    "aria-describedby": message ? metaId : undefined,
    onChange: (event: ChangeEvent<Control>) => {
      setLength(event.target.value.length);
      if (props.error) setEditedSinceError(true);
      (props.onChange as ((event: ChangeEvent<Control>) => void) | undefined)?.(event);
    },
  };

  return (
    <label className={cx("tm-field", error && "tm-field--error", className)}>
      <span className="tm-field__label">
        {label}
        {optional && <span className={styles.optional}> (isteğe bağlı)</span>}
      </span>
      {renderControl(props, controlProps)}
      {hasMeta && (
        <span className="tm-field__meta">
          {message && <span id={metaId}>{message}</span>}
          {showCount && (
            <span className="tm-field__count">
              {count} / {maxLength}
            </span>
          )}
        </span>
      )}
    </label>
  );
}

function renderControl(props: FieldProps, controlProps: object) {
  if (props.as === "textarea") {
    const { as, label, hint, error, optional, counter, className, ...rest } = props;
    return <textarea {...rest} {...controlProps} />;
  }
  if (props.as === "select") {
    const { as, label, hint, error, optional, counter, className, ...rest } = props;
    return <select {...rest} {...controlProps} />;
  }
  const { as, label, hint, error, optional, counter, className, ...rest } = props;
  return <input {...rest} {...controlProps} />;
}
