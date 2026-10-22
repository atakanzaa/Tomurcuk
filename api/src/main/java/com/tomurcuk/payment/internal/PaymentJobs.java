package com.tomurcuk.payment.internal;

import java.time.Duration;

import com.tomurcuk.payment.Payments;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "tomurcuk.jobs.enabled", havingValue = "true", matchIfMissing = true)
class PaymentJobs {

	private final Payments payments;

	PaymentJobs(Payments payments) {
		this.payments = payments;
	}

	/** Ödeme alındı ama callback gelmediyse sipariş en geç 15 dakikada güncellenir. */
	@Scheduled(fixedDelayString = "PT15M", initialDelayString = "PT1M")
	void reconcile() {
		payments.reconcile(Duration.ofMinutes(5));
	}
}
