import type { ReactNode } from "react";
import { cx } from "@/lib/cx";

interface KraftBandProps {
  /** Özel gün hatırlatması için "peony". */
  tone?: "kraft" | "peony";
  /** Tek cümlelik özet; vurgulanan kısım <strong> içinde. */
  children: ReactNode;
  /** Sağdaki isteğe bağlı eylem ya da işaret (buton, ikon). */
  action?: ReactNode;
  className?: string;
}

/** Sayfanın en önemli özeti. Sayfa başına en fazla bir bant, başlığın hemen altında. */
export function KraftBand({ tone = "kraft", children, action, className }: KraftBandProps) {
  return (
    <div className={cx("tm-band", tone === "peony" && "tm-band--peony", className)}>
      <span className="tm-band__text">{children}</span>
      {action}
    </div>
  );
}
