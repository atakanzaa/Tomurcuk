import "server-only";
import type { TomurcukApi } from "../contract";
import type {
  PasswordHolder,
  PasswordLink,
  PilotApplication,
  AuditEntry,
  CannedReply,
  Impersonation,
  ShopOverview,
  ShopSummary,
  SupportOrderView,
  SupportSearchResult,
  SupportUser,
  TicketDetail,
  TicketSummary,
} from "../types";
import { ApiError, get, getOrNull, path, remove, send, sendOrNull } from "./client";

export type SupportApi = Pick<
  TomurcukApi,
  | "getSupportUser"
  | "getSupportUsers"
  | "getTickets"
  | "getTicket"
  | "replyToTicket"
  | "escalateTicket"
  | "revealPhone"
  | "getShopSummaries"
  | "getShopOverview"
  | "addShopNote"
  | "startImpersonation"
  | "endImpersonation"
  | "searchSupport"
  | "getAuditLog"
  | "getCannedReplies"
  | "getSupportOrders"
  | "getShopTickets"
  | "createTicket"
  | "submitPilotApplication"
  | "getPilotApplications"
  | "openShop"
  | "createPasswordLink"
  | "getPasswordHolder"
  | "setPassword"
>;

/**
 * Müşteri hizmetleri paneli, panelden açılan talepler ve tanıtım sitesinin başvuru formu;
 * api/ support, identity ve marketing modülleri. Kişisel veri maskeli gelir.
 */
export const httpSupportApi: SupportApi = {
  getSupportUser: () => get<SupportUser>("/api/support/me"),
  getSupportUsers: () => get<SupportUser[]>("/api/support/users"),
  getTickets: () => get<TicketSummary[]>("/api/support/tickets"),
  getTicket: (ticketId) => getOrNull<TicketDetail>(path`/api/support/tickets/${ticketId}`),
  replyToTicket: (ticketId, input) => send("POST", path`/api/support/tickets/${ticketId}/replies`, input),
  escalateTicket: async (ticketId) => {
    const result = await send<{ escalated: boolean }, never>("POST", path`/api/support/tickets/${ticketId}/escalate`, {});
    return result.ok && result.value.escalated;
  },
  revealPhone: async (orderId, field, reason) => {
    try {
      const result = await send<{ phone: string }, "reason">("POST", path`/api/support/orders/${orderId}/reveal-phone`, {
        field,
        reason,
      });
      return result.ok ? result.value.phone : null;
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) return null;
      throw error;
    }
  },
  getShopSummaries: () => get<ShopSummary[]>("/api/support/shops"),
  getShopOverview: (shopId) => getOrNull<ShopOverview>(path`/api/support/shops/${shopId}`),
  addShopNote: (shopId, text) => send("POST", path`/api/support/shops/${shopId}/notes`, { text }),
  startImpersonation: async (shopId, reason) => {
    const result = await send<Impersonation, "reason">("POST", path`/api/support/shops/${shopId}/impersonations`, { reason });
    return result.ok ? result.value : null;
  },
  endImpersonation: async (impersonationId) => {
    await remove(path`/api/support/impersonations/${impersonationId}`);
  },
  searchSupport: (query) => get<SupportSearchResult>(`/api/support/search?q=${encodeURIComponent(query)}`),
  getAuditLog: () => get<AuditEntry[]>("/api/support/audit"),
  getCannedReplies: () => get<CannedReply[]>("/api/support/canned-replies"),
  getSupportOrders: () => get<(SupportOrderView & { shopName: string })[]>("/api/support/orders"),
  // Panelin "Yardım" sayfası: dükkân oturumdan gelir.
  getShopTickets: () => get<TicketSummary[]>("/api/panel/tickets"),
  createTicket: (_shopId, input) => send("POST", "/api/panel/tickets", input),
  submitPilotApplication: (input) => send("POST", "/api/public/pilot-applications", input),
  getPilotApplications: () => get<PilotApplication[]>("/api/support/pilot-applications"),
  openShop: (input) => send("POST", "/api/support/shops", input),
  createPasswordLink: async (shopId) => {
    const result = await sendOrNull<PasswordLink, never>("POST", path`/api/support/shops/${shopId}/password-link`, {});
    return result?.ok ? result.value : null;
  },
  // Şifre belirleme bağlantısı: oturumsuz, token'ın kendisi yetkidir.
  getPasswordHolder: (token) => getOrNull<PasswordHolder>(path`/api/public/password-setup/${token}`),
  setPassword: (token, password) => send("POST", "/api/public/password-setup", { token, password }),
};
