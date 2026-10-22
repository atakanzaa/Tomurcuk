package com.tomurcuk.ordering.internal;

import com.tomurcuk.ordering.OrderConfirmed;
import com.tomurcuk.ordering.OrderStatus;
import com.tomurcuk.payment.PaymentSucceeded;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

/** Ödeme kaydıyla aynı işlemde çalışır; sipariş ödendi olarak işaretlenir ve kesinleşir. */
@Component
class PaymentListener {

	private static final Logger log = LoggerFactory.getLogger(PaymentListener.class);

	private final OrderStore orders;

	private final ApplicationEventPublisher events;

	PaymentListener(OrderStore orders, ApplicationEventPublisher events) {
		this.orders = orders;
		this.events = events;
	}

	@EventListener
	void on(PaymentSucceeded event) {
		boolean firstPayment = orders.markPaid(event.orderId()) == 1;
		orders.findById(event.orderId()).ifPresent(order -> {
			if (firstPayment && order.status() != OrderStatus.CANCELLED) {
				events.publishEvent(new OrderConfirmed(Notices.of(order)));
			}
			if (!firstPayment) {
				log.error("Sipariş ikinci kez ödendi, iade gerekir: {} ({}), ödeme {}", order.number(), order.shopId(),
						event.paymentId());
			}
			if (order.status() == OrderStatus.CANCELLED) {
				log.error("İptal edilmiş siparişin ödemesi geldi, iade gerekir: {} ({})", order.number(),
						order.shopId());
			}
		});
	}
}
