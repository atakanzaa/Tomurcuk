import type { TomurcukApi } from "@/lib/api/contract";
import type { VitrinApi } from "@/lib/api/http/vitrin";
import { mockCheckoutApi } from "./checkout";
import { mockPanelApi } from "./panel";
import { mockSupportApi } from "./support";
import { getStore } from "./store";

// Çağıranın sabit veriyi değiştirememesi için her yanıt kopyalanır, tıpkı ağdan gelmiş gibi.
const copy = <T>(value: T): T => structuredClone(value);

/** Henüz API'ye geçmemiş fonksiyonlar. Vitrin okumaları api/'den gelir (lib/api/http/vitrin.ts). */
export const mockApi: Omit<TomurcukApi, keyof VitrinApi> = {
  async getOrders(shopId, filter) {
    return copy(
      getStore()
        .orders.filter(
          (o) =>
            o.shopId === shopId &&
            (!filter?.from || o.deliveryDate >= filter.from) &&
            (!filter?.to || o.deliveryDate <= filter.to),
        )
        .sort((a, b) => a.deliveryDate.localeCompare(b.deliveryDate) || a.slotStart.localeCompare(b.slotStart)),
    );
  },

  ...mockCheckoutApi,
  ...mockPanelApi,
  ...mockSupportApi,
};
