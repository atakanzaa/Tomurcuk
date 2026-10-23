package com.tomurcuk.catalog;

/**
 * Alıcı ana sayfasında dükkân satırındaki ürün. `price` en küçük boyla birlikte en düşük fiyattır
 * (kuruş); birden çok boy varsa `priceFrom` doğrudur ve "850 TL'den" yazılır.
 */
public record ProductCard(String id, String name, long price, boolean priceFrom, String photoUrl) {
}
