package com.tomurcuk.discovery;

import com.tomurcuk.catalog.ProductCard;

/** Ana sayfadaki "Bu hafta çiçekçilerin tezgâhından" seçkisi: ürün ve dükkânı. */
public record Pick(String shopSlug, String shopName, ProductCard product) {
}
