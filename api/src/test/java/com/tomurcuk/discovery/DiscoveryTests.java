package com.tomurcuk.discovery;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

import com.tomurcuk.MutableClock;
import com.tomurcuk.TestcontainersConfiguration;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;

/** Alıcı ana sayfasında sıra: o gün teslim edebilenler önce, ilk müsait aralığa göre. */
@SpringBootTest(properties = "tomurcuk.jobs.enabled=false")
@ActiveProfiles("demo")
@Import(TestcontainersConfiguration.class)
class DiscoveryTests {

	@Autowired
	Discovery discovery;

	@Autowired
	MutableClock clock;

	@Test
	void shopsThatCanDeliverTodayComeFirst() {
		clock.set(Instant.parse("2026-10-22T07:00:00Z"));

		List<ShopMatch> shops = discovery.shops("Kadıköy", "Caferağa", LocalDate.parse("2026-10-22"));

		assertThat(shops).extracting(ShopMatch::name)
			.containsExactly("Nergis Çiçek Atölyesi", "Begonvil Atölye", "Lale Bahçesi");
		assertThat(shops).extracting(ShopMatch::availability)
			.containsExactly(Availability.OPEN, Availability.OPEN, Availability.SAME_DAY_CLOSED);
		assertThat(shops.getFirst().cutoff()).isEqualTo("15:00");
		assertThat(shops.getFirst().deliveryFee()).isEqualTo(9000);
		assertThat(shops.getLast().next()).isEqualTo(new ShopMatch.NextSlot(LocalDate.parse("2026-10-23"), "10:00", "13:00"));
		assertThat(discovery.areas()).contains(new Area("Kadıköy", "Caferağa"), new Area("Kadıköy", null));
	}
}
