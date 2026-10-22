package com.tomurcuk.ordering.internal;

import java.time.Instant;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.tomurcuk.catalog.OptionKind;

/**
 * Alıcının sipariş taslağı; JSON'u web/lib/api/types.ts `OrderDraft`. Ürün adı ve fiyatı
 * seçildiği andaki değerdir, ödemeden önce yeniden doğrulanır.
 */
public record Draft(String id, String shopId, Item item, Delivery delivery, Card card, long subtotal,
		long deliveryFee, long total, @JsonIgnore String orderId, @JsonIgnore Instant expiresAt) {

	public Draft withItem(Item newItem) {
		return new Draft(id, shopId, newItem, delivery, card, 0, 0, 0, orderId, expiresAt).withTotals();
	}

	public Draft withDelivery(Delivery newDelivery) {
		return new Draft(id, shopId, item, newDelivery, card, 0, 0, 0, orderId, expiresAt).withTotals();
	}

	public Draft withCard(Card newCard) {
		return new Draft(id, shopId, item, delivery, newCard, subtotal, deliveryFee, total, orderId, expiresAt);
	}

	public Draft withTotals() {
		long fee = delivery == null ? 0 : delivery.fee();
		return new Draft(id, shopId, item, delivery, card, item.lineTotal(), fee, item.lineTotal() + fee, orderId,
				expiresAt);
	}

	public record Item(String productId, String productName, long unitPrice, List<Option> options, long lineTotal) {
	}

	public record Option(String id, String name, String detail, OptionKind kind, long extraPrice) {
	}

	/** Mahalle, bölge mahalle düzeyinde değilse alıcının yazdığıdır. `reservedUntil` ISO anı. */
	public record Delivery(String date, String slotId, String slotStart, String slotEnd, String zoneId,
			String district, String neighborhood, long fee, String recipientName, String recipientPhone,
			String address, String courierNote, String reservedUntil) {
	}

	/** İsimsiz gönderimde imza boş tutulur. */
	public record Card(String message, String signature, boolean anonymous, String senderPhone) {
	}
}
