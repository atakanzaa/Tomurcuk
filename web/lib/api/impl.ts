import "server-only";
import { mockApi } from "@/lib/mock/api";
import type { TomurcukApi } from "./contract";
import { httpCheckoutApi } from "./http/checkout";
import { httpVitrinApi } from "./http/vitrin";

/**
 * Kullanılan uygulama. Backend aşamaları ilerledikçe modüller mock'tan HTTP'ye geçer
 * (docs/backend.md "Aşamalar"); hepsi geçince mock silinir.
 */
export const impl: TomurcukApi = { ...mockApi, ...httpVitrinApi, ...httpCheckoutApi };
