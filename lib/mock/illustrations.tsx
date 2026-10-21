// Mock ürün "fotoğrafları": tasarımlardaki çizimler. Gerçek fotoğraflar gelince bu dosya
// ve `mock:` adresleri kaldırılır. Renkler temadan geldiği için <img> değil satır içi SVG.
import type { CSSProperties, ReactNode } from "react";

const fill = (token: string): CSSProperties => ({ fill: `var(--${token})` });
const ring: CSSProperties = { fill: "var(--paper-raised)", stroke: "var(--kraft-deep)", strokeWidth: 2 };

const card = (children: ReactNode) => (
  <svg viewBox="0 0 171 214" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
    {children}
  </svg>
);

const illustrations: Record<string, () => ReactNode> = {
  p_lale: () => (
    <svg viewBox="0 0 600 500" preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false">
      <rect x="222" y="210" width="6" height="290" style={fill("stem")} />
      <rect x="288" y="150" width="6" height="350" style={fill("stem")} />
      <rect x="354" y="226" width="6" height="274" style={fill("stem")} />
      <rect x="156" y="270" width="6" height="230" style={fill("stem")} />
      <rect x="418" y="282" width="6" height="218" style={fill("stem")} />
      <rect x="198" y="128" width="54" height="92" rx="27" style={fill("peony")} />
      <rect x="264" y="66" width="54" height="92" rx="27" style={fill("peony")} />
      <rect x="330" y="150" width="54" height="92" rx="27" style={fill("pollen")} />
      <rect x="132" y="194" width="54" height="92" rx="27" style={fill("pollen")} />
      <rect x="394" y="206" width="54" height="92" rx="27" style={fill("peony")} />
      <path d="M0 410 C 150 360, 240 460, 600 396 L 600 500 L 0 500 Z" style={fill("kraft-deep")} />
    </svg>
  ),
  p_mevsim: () =>
    card(
      <>
        <rect x="83" y="104" width="4" height="110" style={fill("stem")} />
        <circle cx="70" cy="92" r="30" style={fill("peony")} />
        <circle cx="110" cy="80" r="22" style={fill("pollen")} />
        <circle cx="98" cy="122" r="18" style={fill("paper")} />
        <circle cx="70" cy="92" r="9" style={fill("paper")} />
      </>,
    ),
  p_beyaz_gul: () =>
    card(
      <>
        <rect x="54" y="110" width="4" height="104" style={fill("stem")} />
        <rect x="84" y="96" width="4" height="118" style={fill("stem")} />
        <rect x="114" y="116" width="4" height="98" style={fill("stem")} />
        <circle cx="56" cy="100" r="20" style={ring} />
        <circle cx="86" cy="80" r="22" style={ring} />
        <circle cx="116" cy="104" r="20" style={ring} />
      </>,
    ),
  p_orkide: () =>
    card(
      <>
        <path d="M60 214 C 58 150, 70 100, 112 60" style={{ fill: "none", stroke: "var(--stem)", strokeWidth: 4 }} />
        <ellipse cx="80" cy="104" rx="16" ry="11" style={fill("peony")} />
        <ellipse cx="96" cy="82" rx="15" ry="10" style={fill("peony")} />
        <ellipse cx="114" cy="64" rx="13" ry="9" style={fill("peony")} />
        <circle cx="80" cy="104" r="4" style={fill("pollen")} />
        <rect x="34" y="168" width="60" height="46" rx="8" style={fill("kraft-deep")} />
      </>,
    ),
  p_kir: () =>
    card(
      <>
        <rect x="48" y="96" width="3" height="118" style={fill("stem")} />
        <rect x="72" y="76" width="3" height="138" style={fill("stem")} />
        <rect x="96" y="90" width="3" height="124" style={fill("stem")} />
        <rect x="120" y="104" width="3" height="110" style={fill("stem")} />
        <rect x="40" y="70" width="19" height="32" rx="9.5" style={fill("pollen")} />
        <rect x="64" y="50" width="19" height="32" rx="9.5" style={fill("peony")} />
        <rect x="88" y="64" width="19" height="32" rx="9.5" style={fill("pollen")} />
        <rect x="112" y="78" width="19" height="32" rx="9.5" style={fill("peony")} />
      </>,
    ),
  p_sakayik: () =>
    card(
      <>
        <rect x="84" y="112" width="4" height="102" style={fill("stem")} />
        <circle cx="86" cy="92" r="40" style={fill("peony-soft")} />
        <circle cx="86" cy="92" r="27" style={fill("peony")} />
        <circle cx="86" cy="92" r="12" style={fill("peony-soft")} />
      </>,
    ),
  p_papatya: () =>
    card(
      <>
        <rect x="36" y="128" width="100" height="70" rx="6" style={fill("kraft-deep")} />
        <circle cx="56" cy="122" r="14" style={fill("paper")} />
        <circle cx="86" cy="114" r="16" style={fill("paper")} />
        <circle cx="116" cy="122" r="14" style={fill("paper")} />
        <circle cx="56" cy="122" r="5" style={fill("pollen")} />
        <circle cx="86" cy="114" r="6" style={fill("pollen")} />
        <circle cx="116" cy="122" r="5" style={fill("pollen")} />
      </>,
    ),
  p_monstera: () =>
    card(
      <>
        <rect x="58" y="150" width="56" height="64" rx="8" style={fill("kraft-deep")} />
        <ellipse cx="66" cy="112" rx="26" ry="18" transform="rotate(-30 66 112)" style={fill("stem")} />
        <ellipse cx="108" cy="100" rx="28" ry="19" transform="rotate(25 108 100)" style={fill("stem")} />
        <ellipse cx="88" cy="76" rx="20" ry="14" style={fill("stem")} />
      </>,
    ),
  p_celenk: () =>
    card(
      <>
        <rect x="83" y="140" width="5" height="74" style={fill("kraft-deep")} />
        <circle cx="86" cy="96" r="52" style={{ fill: "none", stroke: "var(--stem)", strokeWidth: 14 }} />
        <circle cx="56" cy="64" r="9" style={fill("paper")} />
        <circle cx="116" cy="64" r="9" style={fill("paper")} />
        <circle cx="40" cy="104" r="9" style={fill("paper")} />
        <circle cx="132" cy="104" r="9" style={fill("paper")} />
      </>,
    ),
};

export const MOCK_PHOTO_PREFIX = "mock:";

/** `mock:p_lale` gibi bir adres için çizimi döner; tanınmayan adreste null. */
export function mockIllustration(photoUrl: string): ReactNode | null {
  const render = illustrations[photoUrl.slice(MOCK_PHOTO_PREFIX.length)];
  return render ? render() : null;
}
