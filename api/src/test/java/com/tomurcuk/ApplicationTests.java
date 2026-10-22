package com.tomurcuk;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;

/**
 * Uygulama gerçek Postgres'e karşı açılıyor; migration'lar ve örnek veri uygulanıyor,
 * entity'ler şemayla uyuşuyor (`ddl-auto: validate`).
 */
@SpringBootTest
@ActiveProfiles("demo")
@Import(TestcontainersConfiguration.class)
class ApplicationTests {

	@Test
	void contextLoads() {
	}
}
