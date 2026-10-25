package com.tomurcuk.review;

import java.time.Instant;

/** Alıcı ana sayfasındaki "Alıcılar ne diyor": yorum, ürün ve teslim eden dükkân. */
public record RecentReview(String id, int rating, String text, String authorName, String district,
		Instant createdAt, String productName, String shopSlug, String shopName) {
}
