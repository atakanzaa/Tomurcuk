package com.tomurcuk.review;

import java.util.List;

/** Ürün sayfası: puan ve en yeni görünür yorumlar. */
public record ProductReviews(Rating rating, List<Review> reviews) {
}
