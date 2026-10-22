import type { ReactNode } from "react";

/** Renk eşlemesi sabittir; renk tek başına anlam taşımaz, durum her zaman kelimeyle yazılır. */
export type StatusTone = "new" | "preparing" | "onway" | "delivered" | "failed" | "muted";

interface StatusTagProps {
  tone: StatusTone;
  /** Durum kelimesi: "Yeni", "Hazırlanıyor", "Ödeme bekleniyor"… */
  children: ReactNode;
}

/** Sipariş ve talep durumu. Tıklanmaz; durum değiştirme ayrı bir butondur. */
export function StatusTag({ tone, children }: StatusTagProps) {
  return <span className={`tm-status tm-status--${tone}`}>{children}</span>;
}
