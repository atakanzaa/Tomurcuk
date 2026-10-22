package com.tomurcuk;

import java.time.Instant;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.testcontainers.postgresql.PostgreSQLContainer;

/** Bütün entegrasyon testleri aynı Postgres container'ını ve ayarlanabilir saati kullanır. */
@TestConfiguration(proxyBeanMethods = false)
public class TestcontainersConfiguration {

	@Bean
	@ServiceConnection
	PostgreSQLContainer postgres() {
		return new PostgreSQLContainer("postgres:17-alpine");
	}

	/** Testler saati kendisi ayarlar; varsayılan tasarımın taban günü, İstanbul'da 10:00. */
	@Bean
	@Primary
	MutableClock testClock() {
		return new MutableClock(Instant.parse("2026-10-22T07:00:00Z"));
	}
}
