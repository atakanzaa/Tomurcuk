import { ShopPlan } from "@/lib/api/types";

export const planLabel: Record<ShopPlan, string> = {
  [ShopPlan.Pilot]: "Pilot",
  [ShopPlan.Starter]: "Başlangıç paket",
  [ShopPlan.Pro]: "Pro paket",
};
