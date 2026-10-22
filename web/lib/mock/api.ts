import type { TomurcukApi } from "@/lib/api/contract";
import type { CheckoutApi } from "@/lib/api/http/checkout";
import type { PanelApi } from "@/lib/api/http/panel";
import type { VitrinApi } from "@/lib/api/http/vitrin";
import { mockSupportApi } from "./support";

/** Henüz API'ye geçmemiş fonksiyonlar: destek ve tanıtım sitesi. */
export const mockApi: Omit<TomurcukApi, keyof VitrinApi | keyof CheckoutApi | keyof PanelApi> = {
  ...mockSupportApi,
};
