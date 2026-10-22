import { findCustomerByPhone } from "@/lib/api";
import { orderItemsSummary } from "@/lib/order";
import { loadPanel } from "@/lib/panel/session";

/**
 * Elle sipariş girerken telefonla müşteri bulma. Okuma işi olduğu için Server Action
 * değil GET; yanıt kişiye özel olduğu için önbelleğe alınmaz.
 */
export async function GET(request: Request) {
  const phone = new URL(request.url).searchParams.get("telefon") ?? "";
  const { shop } = await loadPanel();
  const customer = await findCustomerByPhone(shop.id, phone);
  if (!customer) return Response.json(null, { headers: { "Cache-Control": "private, no-store" } });
  const last = customer.lastOrder;
  return Response.json(
    {
      name: customer.name,
      orderCount: customer.orderCount,
      lastOrderAt: customer.lastOrderAt,
      lastOrder: last && {
        summary: orderItemsSummary(last),
        items: last.items.map((i) => ({ productId: i.productId, optionName: i.options.find((o) => o.kind === "size")?.name ?? null, quantity: i.quantity })),
        recipientName: last.recipientName,
        recipientPhone: last.recipientPhone,
        address: [last.address, last.zoneName.split(",")[0]].filter(Boolean).join(", "),
      },
    },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
