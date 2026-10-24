package com.tomurcuk.ordering.internal;

/**
 * Panelin sesli uyarısı için: bekleyen yeni sipariş sayısı ve en son gelenin kimliği.
 * web/lib/api/types.ts `NewOrders`; sipariş yoksa `latestOrderId` boş.
 */
public record NewOrders(int count, String latestOrderId, String latestNumber) {
}
