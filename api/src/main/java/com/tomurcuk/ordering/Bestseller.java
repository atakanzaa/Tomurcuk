package com.tomurcuk.ordering;

/**
 * Dükkânın son 90 günde en çok teslim edilen ürünü ve kaç siparişte gönderildiği; vitrinde
 * "En çok gönderilen". web/lib/api/types.ts `Bestseller`; yeterli sipariş yoksa `productId` boş.
 */
public record Bestseller(String productId, int orders) {
}
