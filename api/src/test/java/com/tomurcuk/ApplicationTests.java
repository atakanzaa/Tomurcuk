package com.tomurcuk;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;

/** Uygulama gerçek Postgres'e karşı açılıyor ve Flyway migration'ları uygulanıyor. */
@SpringBootTest
@Import(TestcontainersConfiguration.class)
class ApplicationTests {

	@Test
	void contextLoads() {
	}
}
