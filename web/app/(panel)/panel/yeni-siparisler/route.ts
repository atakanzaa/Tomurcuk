import { getNewOrders } from "@/lib/api";
import { loadPanel } from "@/lib/panel/session";

/** Panelin sesli uyarısı 30 saniyede bir sorar. Kişiye özel; önbelleğe alınmaz. */
export async function GET() {
  const { shop } = await loadPanel();
  const orders = await getNewOrders(shop.id);
  return Response.json(orders, { headers: { "Cache-Control": "private, no-store" } });
}
