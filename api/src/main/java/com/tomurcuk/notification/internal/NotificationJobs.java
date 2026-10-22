package com.tomurcuk.notification.internal;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "tomurcuk.jobs.enabled", havingValue = "true", matchIfMissing = true)
class NotificationJobs {

	private final NotificationLog notifications;

	NotificationJobs(NotificationLog notifications) {
		this.notifications = notifications;
	}

	@Scheduled(fixedDelayString = "PT1M", initialDelayString = "PT1M")
	void retry() {
		notifications.retryDue();
	}
}
