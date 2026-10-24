import "server-only";
import { headers } from "next/headers";
import type { TomurcukApi } from "../contract";
import type { DeliveryDay, OrderContract, OrderDraft, OrderTracking, PlacedOrder } from "../types";
import { get, getOrNull, path, postOrNull, send } from "./client";

export type CheckoutApi = Pick<
  TomurcukApi,
  | "getDeliveryDays"
  | "createDraft"
  | "getDraft"
  | "saveDelivery"
  | "saveCard"
  | "placeOrder"
  | "completePayment"
  | "getOrderTracking"
  | "getOrderContract"
  | "findTrackingToken"
>;

/** Alıcı sipariş akışı; api/ delivery, ordering ve payment modülleri. */
export const httpCheckoutApi: CheckoutApi = {
  getDeliveryDays: (shopId, days) =>
    get<DeliveryDay[]>(`${path`/api/public/shops/${shopId}/delivery-days`}?days=${days}`),
  createDraft: (shopId, input) => send<OrderDraft, "product" | "size" | "options">("POST", path`/api/public/shops/${shopId}/drafts`, input),
  getDraft: (shopId, draftId) => getOrNull<OrderDraft>(path`/api/public/shops/${shopId}/drafts/${draftId}`),
  saveDelivery: (shopId, draftId, input) => send("PUT", path`/api/public/shops/${shopId}/drafts/${draftId}/delivery`, input),
  saveCard: (shopId, draftId, input) => send("PUT", path`/api/public/shops/${shopId}/drafts/${draftId}/card`, input),
  // Ödeme sağlayıcısı alıcının IP'sini ister; tarayıcı API'yi görmediği için Next iletir.
  placeOrder: async (shopId, draftId, input) =>
    send<PlacedOrder, "paymentMethod" | "consent" | "idempotencyKey" | "draft">(
      "POST",
      path`/api/public/shops/${shopId}/drafts/${draftId}/order`,
      { ...input, clientIp: await clientIp() },
    ),
  completePayment: (shopId, token) =>
    postOrNull<{ trackingToken: string; paid: boolean }>(path`/api/public/shops/${shopId}/payments/complete`, { token }),
  getOrderTracking: (shopId, token) => getOrNull<OrderTracking>(path`/api/public/shops/${shopId}/tracking/${token}`),
  getOrderContract: (shopId, token) =>
    getOrNull<OrderContract>(path`/api/public/shops/${shopId}/tracking/${token}/contract`),
  findTrackingToken: async (shopId, input) =>
    (await postOrNull<{ token: string }>(path`/api/public/shops/${shopId}/tracking-lookup`, input))?.token ?? null,
};

/** Proxy arkasında X-Forwarded-For'un ilk adresi. */
async function clientIp(): Promise<string | null> {
  const list = await headers();
  return list.get("x-forwarded-for")?.split(",")[0]?.trim() || list.get("x-real-ip") || null;
}
