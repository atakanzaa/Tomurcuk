/** Kök düzeyde dükkân slug'ı olamayacak bölümler. Proxy bunlara dokunmaz. */
const RESERVED_SEGMENTS = new Set(["_next", "api", "panel", "destek", "bilesenler"]);

export function isReservedSegment(segment: string): boolean {
  // Nokta içeren bölümler dosyadır (favicon.ico, robots.txt).
  return RESERVED_SEGMENTS.has(segment) || segment.includes(".");
}

export const shopPath = (slug: string) => `/${slug}`;
export const productPath = (slug: string, productId: string) => `/${slug}/urun/${productId}`;
export const trackingPath = (slug: string) => `/${slug}/takip`;
