package com.tomurcuk;

import java.time.Clock;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * "Bugün", son sipariş saati ve rezervasyon süreleri bu saatle hesaplanır; testlerde sabitlenir.
 * Anlar UTC tutulur, gün hesabı dükkânın saat diliminde yapılır.
 */
@Configuration(proxyBeanMethods = false)
class TimeConfig {

	@Bean
	Clock clock() {
		return Clock.systemUTC();
	}
}
