package com.tomurcuk.ordering.internal;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

import com.tomurcuk.catalog.OptionKind;
import com.tomurcuk.ordering.OrderSource;
import com.tomurcuk.ordering.OrderStatus;
import com.tomurcuk.ordering.PaymentMethod;
import com.tomurcuk.ordering.PaymentStatus;

/**
 * Sipariş; JSON'u web/lib/api/types.ts `Order`. Ürün adı, fiyat, bölge adı ve saat aralığı
 * sipariş anında kopyalanır. Saatler "HH:mm", para kuruş.
 */
public record Order(String id, String number, String shopId, String customerId, OrderSource source,
		OrderStatus status, PaymentStatus paymentStatus, PaymentMethod paymentMethod, LocalDate deliveryDate,
		String timeSlotId, String slotStart, String slotEnd, String deliveryTime, boolean exactTime,
		String deliveryZoneId, String zoneName, String recipientName, String recipientPhone, String address,
		String courierNote, String cardNote, String senderName, boolean anonymous, List<Item> items, long subtotal,
		long deliveryFee, long total, String deliveryPhotoUrl, Instant createdAt, String trackingToken,
		String senderPhone, String courierName, List<Event> events) {

	public record Item(String id, String orderId, String productId, String productName, long unitPrice,
			int quantity, List<ItemOption> options) {
	}

	public record ItemOption(String name, OptionKind kind, long extraPrice) {
	}

	public record Event(OrderStatus status, Instant at) {
	}
}
