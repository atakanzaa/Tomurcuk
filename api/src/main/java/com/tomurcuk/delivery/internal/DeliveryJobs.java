package com.tomurcuk.delivery.internal;

import com.tomurcuk.delivery.DeliverySchedule;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "tomurcuk.jobs.enabled", havingValue = "true", matchIfMissing = true)
class DeliveryJobs {

	private final DeliverySchedule schedule;

	DeliveryJobs(DeliverySchedule schedule) {
		this.schedule = schedule;
	}

	/** Süresi dolan 10 dakikalık rezervasyonlar en geç bir dakika içinde serbest kalır. */
	@Scheduled(fixedDelayString = "PT1M")
	void releaseExpiredHolds() {
		schedule.releaseExpiredHolds();
	}
}
