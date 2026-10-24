import "server-only";
import type { TomurcukApi } from "../contract";
import type { CustomerDetail, CustomerSummary, Order, PanelProduct, PanelSession, Reminder } from "../types";
import { get, getOrNull, path, remove, send, sendOrNull } from "./client";

export type PanelApi = Pick<
  TomurcukApi,
  | "getPanelSession"
  | "getOrders"
  | "getOrder"
  | "updateOrderStatus"
  | "markOrderPaid"
  | "getCustomers"
  | "getCustomer"
  | "findCustomerByPhone"
  | "getReminders"
  | "createManualOrder"
  | "getPanelProducts"
  | "getPanelProduct"
  | "saveProduct"
  | "deleteProduct"
  | "uploadProductPhoto"
>;

const query = (params: Record<string, string | number | undefined>) => {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value !== undefined && value !== "") search.set(key, String(value));
  const text = search.toString();
  return text ? `?${text}` : "";
};

/**
 * Satıcı paneli; api/ identity ve ordering modülleri. Dükkân oturumdan gelir: `shopId`
 * parametresi API'ye gönderilmez, başka dükkânın kaydı zaten bulunamaz.
 * Dükkân adına oturum (destek) 6. aşamada gelir; o zamana kadar `impersonationId` yok sayılır.
 */
export const httpPanelApi: PanelApi = {
  getPanelSession: () => get<PanelSession>("/api/panel/session"),
  getOrders: (_shopId, filter) => get<Order[]>(`/api/panel/orders${query({ from: filter?.from, to: filter?.to })}`),
  getOrder: (_shopId, orderId) => getOrNull<Order>(path`/api/panel/orders/${orderId}`),
  updateOrderStatus: (_shopId, orderId, status) => send("POST", path`/api/panel/orders/${orderId}/status`, { status }),
  markOrderPaid: (_shopId, orderId) => send("POST", path`/api/panel/orders/${orderId}/paid`, {}),
  getCustomers: (_shopId, filter) => get<CustomerSummary[]>(`/api/panel/customers${query({ query: filter?.query })}`),
  getCustomer: (_shopId, customerId) => getOrNull<CustomerDetail>(path`/api/panel/customers/${customerId}`),
  findCustomerByPhone: (_shopId, phone) =>
    getOrNull<CustomerSummary & { lastOrder: Order | null }>(`/api/panel/customers/by-phone${query({ phone })}`),
  getReminders: (_shopId, days) => get<Reminder[]>(`/api/panel/reminders${query({ days })}`),
  createManualOrder: (_shopId, input) => send("POST", "/api/panel/orders", input),
  getPanelProducts: () => get<PanelProduct[]>("/api/panel/products"),
  getPanelProduct: (_shopId, productId) => getOrNull<PanelProduct>(path`/api/panel/products/${productId}`),
  saveProduct: (_shopId, productId, input) =>
    productId ? sendOrNull("PUT", path`/api/panel/products/${productId}`, input) : send("POST", "/api/panel/products", input),
  deleteProduct: (_shopId, productId) => remove(path`/api/panel/products/${productId}`),
  uploadProductPhoto: (_shopId, file) => {
    const body = new FormData();
    body.set("file", file, "foto.jpg");
    return send("POST", "/api/panel/photos", body);
  },
};
