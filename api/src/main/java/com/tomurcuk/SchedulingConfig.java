package com.tomurcuk;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;

/** Zamanlanmış işler (rezervasyon temizliği, ödeme sorgusu). Testlerde kapalıdır. */
@Configuration(proxyBeanMethods = false)
@EnableScheduling
@ConditionalOnProperty(name = "tomurcuk.jobs.enabled", havingValue = "true", matchIfMissing = true)
class SchedulingConfig {
}
