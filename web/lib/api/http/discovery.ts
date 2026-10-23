import "server-only";
import type { TomurcukApi } from "../contract";
import type { Area, OrderRef, ShopMatch, ShopPick } from "../types";
import { get, postOrNull } from "./client";

export type DiscoveryApi = Pick<TomurcukApi, "getAreas" | "discoverShops" | "getShopPicks" | "findOrder">;

/** Alıcı ana sayfası; api/ discovery modülü ve dükkândan bağımsız sipariş bulma. */
export const httpDiscoveryApi: DiscoveryApi = {
  getAreas: () => get<Area[]>("/api/public/discover/areas"),
  discoverShops: ({ district, neighborhood, date }) => {
    const query = new URLSearchParams({ district, date });
    if (neighborhood) query.set("neighborhood", neighborhood);
    return get<ShopMatch[]>(`/api/public/discover/shops?${query}`);
  },
  getShopPicks: () => get<ShopPick[]>("/api/public/discover/picks"),
  findOrder: (input) => postOrNull<OrderRef>("/api/public/order-lookup", input),
};
