// Dükkânın teması: kapak fotoğrafından türetilen renkler (api ShopTheme) Tomurcuk'un renklerinin
// yerine dükkânın sayfalarında geçer. Değerler backend'den gelir; yine de yalnızca "#rrggbb" ve
// bilinen değişken adları CSS'e yazılır.
import type { CSSProperties } from "react";
import type { ShopTheme } from "@/lib/api/types";

const KEYS = new Set([
  "paper",
  "paper-raised",
  "kraft",
  "kraft-deep",
  "line",
  "line-strong",
  "ink",
  "ink-muted",
  "stem",
  "stem-hover",
  "on-stem",
]);
const HEX = /^#[0-9a-fA-F]{6}$/;

function declarations(colors: Record<string, string>): string {
  return Object.entries(colors)
    .filter(([key, value]) => KEYS.has(key) && HEX.test(value))
    .map(([key, value]) => `--${key}:${value};`)
    .join("");
}

/** Açık ve koyu tema için kurallar; html'deki data-theme'e göre (lib/theme). */
export function shopThemeCss(theme: ShopTheme): string {
  return `html[data-theme="light"]{${declarations(theme.light)}}html[data-theme="dark"]{${declarations(theme.dark)}}`;
}

/** Paneldeki önizleme için: açık temanın değişkenleri satır içi stil olarak. */
export function shopThemeVars(colors: Record<string, string>): CSSProperties {
  return Object.fromEntries(
    Object.entries(colors)
      .filter(([key, value]) => KEYS.has(key) && HEX.test(value))
      .map(([key, value]) => [`--${key}`, value]),
  ) as CSSProperties;
}
