import type { Metadata } from "next";
import { Schibsted_Grotesk, Young_Serif } from "next/font/google";
import { Theme, themeInitScript } from "@/lib/theme";
import "@/design/tomurcuk/tokens.css";
import "@/design/tomurcuk/components/bundle.css";
import "./globals.css";

// Değişken adları tokens.css ile aynıdır; <body> üzerinde tanımlandıkları için
// :root'taki varsayılan font yığınının yerine geçerler.
const display = Young_Serif({
  weight: "400",
  subsets: ["latin", "latin-ext"],
  variable: "--font-display",
  fallback: ["Georgia", "serif"],
  display: "swap",
});

const sans = Schibsted_Grotesk({
  subsets: ["latin", "latin-ext"],
  variable: "--font-sans",
  fallback: ["system-ui", "sans-serif"],
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "Tomurcuk", template: "%s" },
  description: "Küçük çiçekçilerin sipariş sayfası, sipariş paneli ve müşteri defteri.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // data-theme ilk boyamadan önce betikle değişir; bu fark beklenen bir durumdur.
    <html lang="tr" data-theme={Theme.Light} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className={`${display.variable} ${sans.variable}`}>{children}</body>
    </html>
  );
}
