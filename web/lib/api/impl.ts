import "server-only";
import type { TomurcukApi } from "./contract";
import { httpCheckoutApi } from "./http/checkout";
import { httpPanelApi } from "./http/panel";
import { httpSupportApi } from "./http/support";
import { httpVitrinApi } from "./http/vitrin";

/** Bütün fonksiyonlar Spring Boot API'den (api/); modül başına bir HTTP uygulaması. */
export const impl: TomurcukApi = { ...httpVitrinApi, ...httpCheckoutApi, ...httpPanelApi, ...httpSupportApi };
