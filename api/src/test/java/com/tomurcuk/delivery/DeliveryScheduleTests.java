package com.tomurcuk.delivery;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.Callable;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

import com.tomurcuk.MutableClock;
import com.tomurcuk.TestcontainersConfiguration;
import com.tomurcuk.shop.ShopDirectory;
import com.tomurcuk.shop.ShopInfo;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest(properties = "tomurcuk.jobs.enabled=false")
@ActiveProfiles("demo")
@Import(TestcontainersConfiguration.class)
class DeliveryScheduleTests {

	@Autowired
	DeliverySchedule schedule;

	@Autowired
	ShopDirectory shops;

	@Autowired
	MutableClock clock;

	@Autowired
	JdbcClient jdbc;

	ShopInfo nergis;

	@BeforeEach
	void setUp() {
		clock.set(Instant.parse("2026-10-22T07:00:00Z"));
		nergis = shops.find("shop_nergis").orElseThrow();
	}

	/** Aynı aralığa eşzamanlı rezervasyonlar kapasiteyi aşmaz (sabah aralığı: 6 yer). */
	@Test
	void concurrentHoldsNeverExceedCapacity() throws Exception {
		LocalDate date = LocalDate.parse("2026-10-30");
		Instant expires = clock.instant().plusSeconds(600);
		List<Callable<Boolean>> attempts = new ArrayList<>();
		for (int i = 0; i < 20; i++) {
			String draftId = "concurrent-" + i;
			attempts.add(() -> schedule.hold("shop_nergis", draftId, date, "s_sabah", expires));
		}
		ExecutorService pool = Executors.newFixedThreadPool(20);
		long succeeded = 0;
		for (Future<Boolean> result : pool.invokeAll(attempts)) {
			succeeded += result.get() ? 1 : 0;
		}
		pool.shutdown();

		assertThat(succeeded).isEqualTo(6);
		assertThat(jdbc.sql("SELECT taken FROM slot_capacity WHERE shop_id = 'shop_nergis' AND date = :date AND slot_id = 's_sabah'")
			.param("date", date)
			.query(Integer.class)
			.single()).isEqualTo(6);
	}

	/** Süresi dolan rezervasyonun yeri boşalır. */
	@Test
	void expiredHoldIsReleased() {
		LocalDate date = LocalDate.parse("2026-10-31");
		assertThat(schedule.hold("shop_nergis", "expiring", date, "s_ogle", clock.instant().plusSeconds(600))).isTrue();
		clock.set(clock.instant().plusSeconds(601));
		schedule.releaseExpiredHolds();
		DeliveryDay day = schedule.days(nergis, 10).get(9);
		assertThat(day.date()).isEqualTo(date);
		assertThat(day.slots()).contains(new DeliveryDay.SlotRemaining("s_ogle", 8));
	}

	/** UTC'de hâlâ 22 Ekim iken İstanbul'da 23 Ekim'dir; "bugün" dükkânın saat dilimine göredir. */
	@Test
	void todayFollowsShopTimeZone() {
		clock.set(Instant.parse("2026-10-22T21:30:00Z"));
		DeliveryDay first = schedule.days(nergis, 1).getFirst();
		assertThat(first.date()).isEqualTo(LocalDate.parse("2026-10-23"));
		assertThat(first.sameDayClosed()).isFalse();
		assertThat(first.slots()).extracting(DeliveryDay.SlotRemaining::slotId).containsExactly("s_sabah", "s_ogle", "s_aksam");
	}

	/** İstanbul'da 15:30: aynı gün son saati (15:00) geçti, başlamış aralıklar listede yok. */
	@Test
	void sameDayCutoffUsesShopTime() {
		clock.set(Instant.parse("2026-10-22T12:30:00Z"));
		DeliveryDay today = schedule.days(nergis, 1).getFirst();
		assertThat(today.date()).isEqualTo(LocalDate.parse("2026-10-22"));
		assertThat(today.sameDayClosed()).isTrue();
		assertThat(today.slots()).extracting(DeliveryDay.SlotRemaining::slotId).containsExactly("s_aksam");
	}
}
