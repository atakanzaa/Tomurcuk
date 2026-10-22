package com.tomurcuk.notification;

import static org.assertj.core.api.Assertions.assertThat;
import static org.awaitility.Awaitility.await;

import java.time.Duration;
import java.time.LocalDate;

import com.tomurcuk.TestcontainersConfiguration;
import com.tomurcuk.ordering.OrderNotice;
import com.tomurcuk.ordering.OrderStatus;
import com.tomurcuk.ordering.OrderStatusChanged;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.support.TransactionTemplate;

@SpringBootTest(properties = "tomurcuk.jobs.enabled=false")
@ActiveProfiles("demo")
@Import(TestcontainersConfiguration.class)
class NotificationTests {

	@Autowired
	ApplicationEventPublisher events;

	@Autowired
	TransactionTemplate tx;

	@Autowired
	JdbcClient jdbc;

	/**
	 * Aynı olay iki kez işlenirse alıcıya tek SMS gider. İsimsiz gönderimde alıcıya giden metinde
	 * gönderen geçmez.
	 */
	@Test
	void sameEventSendsOneSmsAndKeepsAnonymousSenderHidden() {
		OrderNotice order = new OrderNotice("o_4817", "shop_nergis", "T-4817", LocalDate.parse("2026-10-22"),
				"10:00", "13:00", "12:00", "Selin Arslan", "0505 412 60 47", "0505 310 22 47", null, true,
				"d4Wn8HcZp1QaE6uJ", "Fenerbahçe, Kadıköy", "Kır buketi", 74000);
		OrderStatusChanged event = new OrderStatusChanged("o_4817", "shop_nergis", OrderStatus.PREPARING,
				OrderStatus.ON_WAY, 3, order);

		tx.executeWithoutResult(status -> events.publishEvent(event));
		tx.executeWithoutResult(status -> events.publishEvent(event));

		await().atMost(Duration.ofSeconds(10))
			.until(() -> jdbc.sql("SELECT count(*) FROM event_publication").query(Integer.class).single() == 0);
		assertThat(jdbc.sql("""
				SELECT text FROM notification_log
				WHERE order_id = 'o_4817' AND kind = 'order_on_way' AND recipient = '0505 412 60 47' AND status = 'sent'
				""").query(String.class).list())
			.singleElement()
			.satisfies(text -> assertThat(text).startsWith("Nergis Çiçek Atölyesi: Size bir gönderi yolda.")
				.doesNotContain("Deniz"));
	}
}
