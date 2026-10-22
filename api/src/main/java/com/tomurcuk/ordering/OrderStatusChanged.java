package com.tomurcuk.ordering;

/** Panelden durum değişti; bildirimler (yolda, teslim edildi SMS'i) bunu dinler. */
public record OrderStatusChanged(String orderId, String shopId, OrderStatus from, OrderStatus to) {
}
