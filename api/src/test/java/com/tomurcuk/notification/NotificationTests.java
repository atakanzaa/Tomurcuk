package com.tomurcuk.notification;

import static org.assertj.core.api.Assertions.assertThat;
import static org.awaitility.Awaitility.await;

import java.time.Duration;
import java.time.LocalDate;
import java.util.List;

import com.tomurcuk.TestcontainersConfiguration;
import com.tomurcuk.ordering.OrderConfirmed;
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
	 * Olay yeniden işlenirse (uygulama yeniden başlayıp yarım kalan olayı tekrar yayınlarsa)
	 * alıcıya ikinci SMS gitmez. İsimsiz gönderimde alıcıya giden metinde gönderen geçmez.
	 */
	@Test
	void reprocessedEventSendsOneSmsAndKeepsAnonymousSenderHidden() {
		OrderNotice order = new OrderNotice("o_4817", "shop_nergis", "T-4817", LocalDate.parse("2026-10-22"),
				"10:00", "13:00", "12:00", "Selin Arslan", "0505 412 60 47", "0505 310 22 47", null, true,
				"d4Wn8HcZp1QaE6uJ", "Fenerbahçe, Kadıköy", "Kır buketi", 74000);
		OrderStatusChanged event = new OrderStatusChanged("o_4817", "shop_nergis", OrderStatus.PREPARING,
				OrderStatus.ON_WAY, 3, order);

		tx.executeWithoutResult(status -> events.publishEvent(event));
		await().atMost(Duration.ofSeconds(10)).until(() -> sent().size() == 1 && pending() == 0);
		tx.executeWithoutResult(status -> events.publishEvent(event));
		await().atMost(Duration.ofSeconds(10)).until(() -> pending() == 0);

		assertThat(sent()).singleElement()
			.satisfies(text -> assertThat(text).startsWith("Nergis Çiçek Atölyesi: Size bir gönderi yolda.")
				.doesNotContain("Deniz"));
	}

	/** Dükkân ayarında açıksa çiçekçiye yeni sipariş SMS'i; olay yeniden işlense de bir kez. */
	@Test
	void floristGetsOneNewOrderSmsWhenEnabled() {
		OrderNotice order = new OrderNotice("o_4824", "shop_nergis", "T-4824", LocalDate.parse("2026-11-14"),
				"13:00", "16:00", null, "Can Öz", "0532 100 20 30", "0532 100 20 31", "Ece Öz", false,
				"n2Qk7RtYv4WsX9aB", "Moda, Kadıköy", "Mevsim buketi", 95000);
		jdbc.sql("UPDATE shop SET notify_sms = true, notify_phone = '0532 999 88 77' WHERE id = 'shop_nergis'").update();
		try {
			tx.executeWithoutResult(status -> events.publishEvent(new OrderConfirmed(order)));
			await().atMost(Duration.ofSeconds(10)).until(() -> pending("o_4824") == 0);
			tx.executeWithoutResult(status -> events.publishEvent(new OrderConfirmed(order)));
			await().atMost(Duration.ofSeconds(10)).until(() -> pending("o_4824") == 0);
			assertThat(jdbc.sql("""
					SELECT text FROM notification_log
					WHERE order_id = 'o_4824' AND kind = 'new_order_sms' AND recipient = '0532 999 88 77'
					""").query(String.class).list()).singleElement()
				.satisfies(text -> assertThat(text).startsWith("Tomurcuk: T-4824 yeni sipariş, 14 Kasım 13:00–16:00, Moda"));
		}
		finally {
			jdbc.sql("UPDATE shop SET notify_sms = false, notify_phone = NULL WHERE id = 'shop_nergis'").update();
		}
	}

	private int pending(String orderId) {
		return jdbc.sql("SELECT count(*) FROM event_publication WHERE serialized_event LIKE :pattern")
			.param("pattern", "%" + orderId + "%")
			.query(Integer.class)
			.single();
	}

	private List<String> sent() {
		return jdbc.sql("""
				SELECT text FROM notification_log
				WHERE order_id = 'o_4817' AND kind = 'order_on_way' AND recipient = '0505 412 60 47' AND status = 'sent'
				""").query(String.class).list();
	}

	/** Bu siparişin henüz işlenmemiş olay kayıtları; tamamlanan kayıt silinir. */
	private int pending() {
		return jdbc.sql("SELECT count(*) FROM event_publication WHERE serialized_event LIKE '%o_4817%'")
			.query(Integer.class)
			.single();
	}
}
