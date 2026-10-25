package com.tomurcuk.review;

/**
 * Takip sayfasındaki yorum bölümü. `canWrite` false ise `reason`: `not_delivered`,
 * `review_closed` (teslimden 30 gün geçti) ya da `already_reviewed` (yorum `review`'da).
 * `authorName` yorumun hangi adla görüneceğidir.
 */
public record ReviewState(boolean canWrite, String reason, String authorName, String productName,
		Review review) {
}
