package com.tomurcuk.ordering.internal;

import java.time.Clock;
import java.time.Duration;

import com.tomurcuk.delivery.DeliverySchedule;
import com.tomurcuk.ordering.OrderStatus;
import com.tomurcuk.payment.Payments;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionTemplate;

@Component
@ConditionalOnProperty(name = "tomurcuk.jobs.enabled", havingValue = "true", matchIfMissing = true)
class OrderingJobs {

	/** 3D Secure yarıda kalırsa sipariş sonsuza kadar beklemez. */
	static final Duration PAYMENT_TIMEOUT = Duration.ofMinutes(30);

	private final OrderStore orders;

	private final DraftStore drafts;

	private final Payments payments;

	private final DeliverySchedule schedule;

	private final TransactionTemplate tx;

	private final Clock clock;

	OrderingJobs(OrderStore orders, DraftStore drafts, Payments payments, DeliverySchedule schedule,
			TransactionTemplate tx, Clock clock) {
		this.orders = orders;
		this.drafts = drafts;
		this.payments = payments;
		this.schedule = schedule;
		this.tx = tx;
		this.clock = clock;
	}

	/**
	 * 30 dakikada ödenmeyen kartlı siparişi iptal eder ve aralığı boşaltır. İptalden önce
	 * sağlayıcıya son kez sorulur; ödeme bu arada geldiyse sipariş kalır.
	 */
	@Scheduled(fixedDelayString = "PT5M", initialDelayString = "PT2M")
	void cancelAbandonedPayments() {
		for (String orderId : orders.findUnpaidCardOrders(clock.instant().minus(PAYMENT_TIMEOUT))) {
			payments.reconcileOrder(orderId);
			tx.executeWithoutResult(status -> {
				if (orders.cancelUnpaid(orderId) == 0) {
					return;
				}
				orders.addEvent(orderId, OrderStatus.CANCELLED, clock.instant(), "Tomurcuk");
				payments.abandon(orderId);
				orders.findById(orderId)
					.filter(order -> order.timeSlotId() != null)
					.ifPresent(order -> schedule.release(order.shopId(), order.deliveryDate(), order.timeSlotId()));
			});
		}
	}

	@Scheduled(fixedDelayString = "PT1H", initialDelayString = "PT5M")
	void deleteExpiredDrafts() {
		drafts.deleteExpired();
	}
}
