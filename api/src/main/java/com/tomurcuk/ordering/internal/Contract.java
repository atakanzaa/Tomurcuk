package com.tomurcuk.ordering.internal;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

import com.tomurcuk.ordering.Order;
import com.tomurcuk.ordering.PaymentMethod;

/**
 * Sözleşmelerde siparişe ait kısım; JSON'u web/lib/api/types.ts `OrderContract`. Takip linkine
 * sahip olan gönderendir; alıcıya giden SMS'te link yoktur, fiyat alıcıya görünmez.
 */
public record Contract(String number, Instant createdAt, String termsVersion, PaymentMethod paymentMethod,
		List<Order.Item> items, long subtotal, long deliveryFee, long total, LocalDate deliveryDate,
		String slotStart, String slotEnd, String recipientName, String zoneName, String address) {

	static Contract of(Order order, String termsVersion) {
		return new Contract(order.number(), order.createdAt(), termsVersion, order.paymentMethod(), order.items(),
				order.subtotal(), order.deliveryFee(), order.total(), order.deliveryDate(), order.slotStart(),
				order.slotEnd(), order.recipientName(), order.zoneName(), order.address());
	}
}
