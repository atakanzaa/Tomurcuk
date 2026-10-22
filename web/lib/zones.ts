import type { DeliveryZone } from "@/lib/api/types";

/**
 * Adres metninde geçen mahalle (yoksa ilçe) adıyla teslim bölgesi. Elle girilen siparişte
 * ücreti göstermek için; backend aynı eşleştirmeyi yapar ve listede olmayan adresi reddeder.
 */
export function detectZone(zones: DeliveryZone[], address: string): DeliveryZone | null {
  const text = address.toLocaleLowerCase("tr");
  if (!text.trim()) return null;
  const active = zones.filter((z) => z.active);
  return (
    active.find((z) => z.neighborhood && text.includes(z.neighborhood.toLocaleLowerCase("tr"))) ??
    active.find((z) => !z.neighborhood && text.includes(z.district.toLocaleLowerCase("tr"))) ??
    null
  );
}
