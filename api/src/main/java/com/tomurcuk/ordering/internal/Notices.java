package com.tomurcuk.ordering.internal;

import java.util.stream.Collectors;

import com.tomurcuk.catalog.OptionKind;
import com.tomurcuk.ordering.Order;
import com.tomurcuk.ordering.OrderNotice;

final class Notices {

	private Notices() {
	}

	/** "Mevsim buketi (O), vazo" biçiminde kısa ürün özeti (web/lib/order.ts orderItemsSummary). */
	static OrderNotice of(Order order) {
		String items = order.items()
			.stream()
			.map(item -> item.productName()
					+ item.options()
						.stream()
						.filter(o -> o.kind() == OptionKind.SIZE)
						.findFirst()
						.map(o -> " (" + o.name().charAt(0) + ")")
						.orElse("")
					+ (item.options().stream().anyMatch(o -> o.kind() == OptionKind.VASE) ? ", vazo" : "")
					+ (item.quantity() > 1 ? " x" + item.quantity() : ""))
			.collect(Collectors.joining(", "));
		return new OrderNotice(order.id(), order.shopId(), order.number(), order.deliveryDate(), order.slotStart(),
				order.slotEnd(), order.deliveryTime(), order.recipientName(), order.recipientPhone(),
				order.senderPhone(), order.anonymous() ? null : order.senderName(), order.anonymous(),
				order.trackingToken(), order.zoneName(), items, order.total(), order.cardNote(), order.paymentMethod());
	}
}
