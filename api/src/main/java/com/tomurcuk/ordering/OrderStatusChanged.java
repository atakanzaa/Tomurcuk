package com.tomurcuk.ordering;

/**
 * Panelden durum değişti; bildirimler (yolda, teslim edildi, teslim edilemedi SMS'i) bunu
 * dinler. `sequence` siparişin kaçıncı durum olayı olduğudur: aynı olay yeniden işlenirse aynı
 * bildirim ikinci kez gitmez, teslim edilemeyen sipariş yeniden yola çıkınca yeni bildirim gider.
 */
public record OrderStatusChanged(String orderId, String shopId, OrderStatus from, OrderStatus to, int sequence,
		OrderNotice order) {
}
