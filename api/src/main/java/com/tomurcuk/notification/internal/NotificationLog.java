package com.tomurcuk.notification.internal;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

import com.tomurcuk.notification.EmailSender;
import com.tomurcuk.notification.SmsSender;
import com.tomurcuk.shared.Ids;
import com.tomurcuk.shared.Instants;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;

/**
 * Bildirimi önce kayda yazar, sonra gönderir. Sağlayıcı hata verirse (ya da çökerse) satır
 * `failed` kalır ve artan aralıklarla yeniden denenir: 1, 5, 30 dakika, 2 saat. Beşinci
 * denemeden sonra bırakılır; destek panelinde sağlayıcının yanıtıyla görünür.
 */
@Service
public class NotificationLog {

	static final List<Duration> BACKOFF = List.of(Duration.ofMinutes(1), Duration.ofMinutes(5),
			Duration.ofMinutes(30), Duration.ofHours(2));

	static final int MAX_ATTEMPTS = BACKOFF.size() + 1;

	private static final Logger log = LoggerFactory.getLogger(NotificationLog.class);

	private final JdbcClient jdbc;

	private final SmsSender sms;

	private final EmailSender email;

	private final Clock clock;

	NotificationLog(JdbcClient jdbc, SmsSender sms, EmailSender email, Clock clock) {
		this.jdbc = jdbc;
		this.sms = sms;
		this.email = email;
		this.clock = clock;
	}

	/**
	 * Aynı `dedupeKey` daha önce yazıldıysa hiçbir şey yapmaz (aynı bildirim iki kez gitmez).
	 * Yazıldıysa hemen gönderir.
	 */
	public void send(Notification notification) {
		Optional<String> id = jdbc.sql("""
				INSERT INTO notification_log (id, shop_id, order_id, order_number, kind, channel, recipient, subject,
				                              text, status, created_at, dedupe_key)
				VALUES (:id, :shopId, :orderId, :orderNumber, :kind, :channel, :recipient, :subject, :text, 'pending',
				        :now, :dedupeKey)
				ON CONFLICT (dedupe_key) DO NOTHING
				RETURNING id
				""")
			.param("id", Ids.newId())
			.param("shopId", notification.shopId())
			.param("orderId", notification.orderId())
			.param("orderNumber", notification.orderNumber())
			.param("kind", notification.kind())
			.param("channel", notification.channel())
			.param("recipient", notification.recipient())
			.param("subject", notification.subject())
			.param("text", notification.text())
			.param("now", Instants.sql(clock.instant()))
			.param("dedupeKey", notification.dedupeKey())
			.query(String.class)
			.optional();
		id.ifPresent(this::attempt);
	}

	/** Zamanı gelmiş başarısız bildirimleri yeniden dener. */
	public int retryDue() {
		List<String> due = jdbc.sql("""
				SELECT id FROM notification_log
				WHERE status = 'failed' AND next_attempt_at <= :now
				ORDER BY next_attempt_at LIMIT 100
				""")
			.param("now", Instants.sql(clock.instant()))
			.query(String.class)
			.list();
		due.forEach(this::attempt);
		return due.size();
	}

	private void attempt(String id) {
		Row row = jdbc.sql("SELECT channel, recipient, subject, text, attempts FROM notification_log WHERE id = :id")
			.param("id", id)
			.query(Row.class)
			.single();
		SmsSender.Result result;
		try {
			result = row.channel().equals("sms") ? sms.send(row.recipient(), row.text())
					: email.send(row.recipient(), row.subject(), row.text());
		}
		catch (RuntimeException ex) {
			log.warn("Bildirim gönderilemedi: {}", id, ex);
			result = new SmsSender.Result(false, ex.getMessage());
		}
		int attempts = row.attempts() + 1;
		Instant now = clock.instant();
		Instant next = !result.delivered() && attempts < MAX_ATTEMPTS ? now.plus(BACKOFF.get(attempts - 1)) : null;
		jdbc.sql("""
				UPDATE notification_log
				SET status = :status, attempts = :attempts, provider_response = :response, next_attempt_at = :next,
				    sent_at = :sentAt
				WHERE id = :id
				""")
			.param("status", result.delivered() ? "sent" : "failed")
			.param("attempts", attempts)
			.param("response", result.response())
			.param("next", Instants.sql(next))
			.param("sentAt", result.delivered() ? Instants.sql(now) : null)
			.param("id", id)
			.update();
	}

	/** `kind`: order_confirmed, order_on_way, order_delivered, order_failed, new_order_email. */
	public record Notification(String shopId, String orderId, String orderNumber, String kind, String channel,
			String recipient, String subject, String text, String dedupeKey) {
	}

	record Row(String channel, String recipient, String subject, String text, int attempts) {
	}
}
