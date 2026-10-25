package com.tomurcuk.review;

import java.util.Map;

/** Vitrin için tek seferde: dükkânın ve her ürünün puanı. Yorumu olmayan ürün haritada yoktur. */
public record ShopRatings(Rating shop, Map<String, Rating> products) {
}
