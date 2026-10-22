package com.tomurcuk.ordering.internal;

import java.time.LocalDate;
import java.util.List;

import com.tomurcuk.ordering.Order;
import com.tomurcuk.ordering.OrderStatus;
import com.tomurcuk.ordering.PaymentMethod;
import com.tomurcuk.ordering.PaymentStatus;

/** Alıcının takip görünümü; JSON'u web/lib/api/types.ts `OrderTracking`. */
public record Tracking(String token, String number, String shopId, OrderStatus status, PaymentStatus paymentStatus,
		PaymentMethod paymentMethod, LocalDate deliveryDate, String slotStart, String slotEnd, String deliveryTime,
		String recipientName, String cardNote, String signature, boolean anonymous, String courierName,
		String deliveryPhotoUrl, String senderPhone, List<Order.Event> events) {

	static Tracking of(Order order) {
		return new Tracking(order.trackingToken(), order.number(), order.shopId(), order.status(),
				order.paymentStatus(), order.paymentMethod(), order.deliveryDate(), order.slotStart(), order.slotEnd(),
				order.deliveryTime(), order.recipientName(), order.cardNote(),
				// İsimsiz gönderimde imza takip sayfasına hiç gönderilmez.
				order.anonymous() ? null : order.senderName(), order.anonymous(), order.courierName(),
				order.deliveryPhotoUrl(), order.senderPhone(), order.events());
	}
}
