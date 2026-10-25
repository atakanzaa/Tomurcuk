import "server-only";
import type { TomurcukApi } from "../contract";
import type { ProductReviews, RecentReview, Review, ReviewField, ReviewState, ShopRatings } from "../types";
import { get, getOrNull, path, sendOrNull } from "./client";

export type ReviewApi = Pick<
  TomurcukApi,
  | "getReviewState"
  | "writeReview"
  | "getShopRatings"
  | "getProductReviews"
  | "getRecentReviews"
  | "getPanelReviews"
  | "hideReview"
>;

/** Ürün yorumları; api/ review modülü. */
export const httpReviewApi: ReviewApi = {
  getReviewState: (shopId, token) => getOrNull<ReviewState>(path`/api/public/shops/${shopId}/tracking/${token}/review`),
  writeReview: (shopId, token, input) =>
    sendOrNull<Review, ReviewField>("POST", path`/api/public/shops/${shopId}/tracking/${token}/review`, input),
  getShopRatings: (shopId) => get<ShopRatings>(path`/api/public/shops/${shopId}/ratings`),
  getProductReviews: (shopId, productId) =>
    get<ProductReviews>(path`/api/public/shops/${shopId}/products/${productId}/reviews`),
  getRecentReviews: () => get<RecentReview[]>("/api/public/discover/reviews"),
  getPanelReviews: () => get<Review[]>("/api/panel/reviews"),
  hideReview: (reviewId, reason) =>
    sendOrNull<Review, "reason">("POST", path`/api/support/reviews/${reviewId}/hide`, { reason }),
};
