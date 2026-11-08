import { findShop } from "@/lib/api";
import { ShopLookupKind } from "@/lib/api/types";

// Logosu olmayan dükkânın sekme ikonu: adının baş harfi, dükkânın renginde. Renk kapaktan
// gelmiyorsa Tomurcuk'un sap yeşili.
const DEFAULT_STEM = "#2e4a35";
const DEFAULT_ON_STEM = "#f6f0e6";
const HEX = /^#[0-9a-fA-F]{6}$/;

const escapeXml = (text: string) =>
  text.replace(/[<>&"']/g, (ch) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" })[ch]!);

export async function GET(_request: Request, { params }: RouteContext<"/[slug]/ikon">) {
  const lookup = await findShop((await params).slug);
  if (lookup.kind !== ShopLookupKind.Found) return new Response(null, { status: 404 });
  const { shop } = lookup;
  const stem = shop.theme?.light.stem;
  const onStem = shop.theme?.light["on-stem"];
  const fill = stem && HEX.test(stem) ? stem : DEFAULT_STEM;
  const text = onStem && HEX.test(onStem) ? onStem : DEFAULT_ON_STEM;
  const initial = escapeXml(shop.shortName.trim().charAt(0).toLocaleUpperCase("tr") || "T");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="7" fill="${fill}"/><text x="16" y="22.5" text-anchor="middle" font-family="Georgia, serif" font-size="19" fill="${text}">${initial}</text></svg>`;
  return new Response(svg, {
    headers: { "Content-Type": "image/svg+xml", "Cache-Control": "public, max-age=3600" },
  });
}
