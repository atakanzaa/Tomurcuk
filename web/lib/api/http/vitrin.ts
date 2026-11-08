import "server-only";
import type { TomurcukApi } from "../contract";
import type { Bestseller, Category, DeliveryZone, Product, ShopLookup, TimeSlot } from "../types";
import { get, getOrNull, path, send } from "./client";

export type VitrinApi = Pick<
  TomurcukApi,
  | "findShop"
  | "getCategories"
  | "getProducts"
  | "getProduct"
  | "getDeliveryZones"
  | "getTimeSlots"
  | "getBestseller"
  | "recordVisit"
>;

/** Vitrin okumaları; api/ shop, catalog ve delivery modülleri. */
export const httpVitrinApi: VitrinApi = {
  findShop: (slug) => get<ShopLookup>(path`/api/public/shop-lookup/${slug}`),
  getCategories: (shopId) => get<Category[]>(path`/api/public/shops/${shopId}/categories`),
  getProducts: (shopId) => get<Product[]>(path`/api/public/shops/${shopId}/products`),
  getBestseller: (shopId) => get<Bestseller>(path`/api/public/shops/${shopId}/bestseller`),
  getProduct: (shopId, productId) => getOrNull<Product>(path`/api/public/shops/${shopId}/products/${productId}`),
  getDeliveryZones: (shopId) => get<DeliveryZone[]>(path`/api/public/shops/${shopId}/delivery-zones`),
  getTimeSlots: (shopId) => get<TimeSlot[]>(path`/api/public/shops/${shopId}/time-slots`),
  recordVisit: async (shopId, channel) => {
    await send("POST", path`/api/public/shops/${shopId}/visits`, { channel });
  },
};
