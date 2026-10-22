import type { TomurcukApi } from "@/lib/api/contract";
import type { CheckoutApi } from "@/lib/api/http/checkout";
import type { VitrinApi } from "@/lib/api/http/vitrin";
import { mockPanelApi } from "./panel";
import { mockSupportApi } from "./support";
import { getStore } from "./store";

// Çağıranın sabit veriyi değiştirememesi için her yanıt kopyalanır, tıpkı ağdan gelmiş gibi.
const copy = <T>(value: T): T => structuredClone(value);

/** Henüz API'ye geçmemiş fonksiyonlar: satıcı paneli, destek ve tanıtım sitesi. */
export const mockApi: Omit<TomurcukApi, keyof VitrinApi | keyof CheckoutApi> = {
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

  ...mockPanelApi,
  ...mockSupportApi,
};
