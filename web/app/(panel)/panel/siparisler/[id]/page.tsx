import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getOrder } from "@/lib/api";
import { OrderBoard } from "../../_components/OrderBoard";
import { panelSession, parseDayView } from "../../_lib";

export const metadata: Metadata = { title: "Sipariş" };

export default function OrderPage({ params, searchParams }: PageProps<"/panel/siparisler/[id]">) {
  return (
    <Suspense>
      <OrderView params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function OrderView({ params, searchParams }: PageProps<"/panel/siparisler/[id]">) {
  const [{ id }, query, session] = await Promise.all([params, searchParams, panelSession()]);
  // Başka dükkânın sipariş kimliği denenirse 403 değil 404: kayıt yokmuş gibi davranılır.
  const order = await getOrder(session.shop.id, id);
  if (!order) notFound();
  return <OrderBoard session={session} view={parseDayView(query.gun)} selected={order} />;
}
