package com.tomurcuk.notification;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

import com.tomurcuk.shared.Ids;
import com.tomurcuk.shared.Instants;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;

/**
 * Bildirimi önce kayda yazar, sonra gönderir. Sağlayıcı hata verirse (ya da çökerse) satır
 * `failed` kalır ve artan aralıklarla yeniden denenir: 1, 5, 30 dakika, 2 saat. Beşinci
 * denemeden sonra ya da kalıcı hatada (yanlış numara, tanımsız başlık) bırakılır; destek
 * panelinde sağlayıcının yanıtıyla görünür.
 */
@Service
public class NotificationLog {

	public static final List<Duration> BACKOFF = List.of(Duration.ofMinutes(1), Duration.ofMinutes(5),
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
				                              text, html, status, created_at, dedupe_key)
				VALUES (:id, :shopId, :orderId, :orderNumber, :kind, :channel, :recipient, :subject, :text, :html,
				        'pending', :now, :dedupeKey)
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
			.param("html", notification.html())
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
		Row row = jdbc.sql("SELECT channel, recipient, subject, text, html, attempts FROM notification_log WHERE id = :id")
			.param("id", id)
			.query(Row.class)
			.single();
		SmsSender.Result result;
		try {
			result = row.channel().equals("sms") ? sms.send(row.recipient(), row.text())
					: email.send(row.recipient(), row.subject(), row.text(), row.html());
		}
		catch (RuntimeException ex) {
			log.warn("Bildirim gönderilemedi: {}", id, ex);
			result = new SmsSender.Result(false, ex.getMessage());
		}
		int attempts = row.attempts() + 1;
		Instant now = clock.instant();
		Instant next = !result.delivered() && result.retryable() && attempts < MAX_ATTEMPTS
				? now.plus(BACKOFF.get(attempts - 1)) : null;
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

	/** Siparişin bildirimleri, eskiden yeniye. */
	public List<Sent> forOrder(String orderId) {
		return jdbc.sql(SELECT_SENT + " WHERE order_id = :orderId ORDER BY created_at")
			.param("orderId", orderId)
			.query(NotificationLog::mapSent)
			.list();
	}

	/** Dükkânın son bildirimleri, yeniden eskiye. */
	public List<Sent> forShop(String shopId, int limit) {
		return jdbc.sql(SELECT_SENT + " WHERE shop_id = :shopId ORDER BY created_at DESC LIMIT :limit")
			.param("shopId", shopId)
			.param("limit", limit)
			.query(NotificationLog::mapSent)
			.list();
	}

	/** `since`'ten bu yana gönderilen SMS sayısı (paket kullanımı). */
	public int smsSentSince(String shopId, Instant since) {
		return jdbc.sql("SELECT count(*) FROM notification_log WHERE shop_id = :shopId AND channel = 'sms' AND status = 'sent' AND created_at >= :since")
			.param("shopId", shopId)
			.param("since", Instants.sql(since))
			.query(Integer.class)
			.single();
	}

	private static final String SELECT_SENT = """
			SELECT id, shop_id, order_number, kind, channel, recipient, coalesce(subject, text) AS text,
			       status = 'sent' AS delivered, provider_response, coalesce(sent_at, created_at) AS at
			FROM notification_log""";

	private static Sent mapSent(java.sql.ResultSet rs, int row) throws java.sql.SQLException {
		return new Sent(rs.getString("id"), rs.getString("shop_id"), rs.getString("order_number"), rs.getString("kind"),
				rs.getString("channel"), rs.getString("recipient"), rs.getString("text"), rs.getBoolean("delivered"),
				rs.getString("provider_response"), rs.getTimestamp("at").toInstant());
	}

	/** Destek ekranında görünen bildirim. */
	public record Sent(String id, String shopId, String orderNumber, String kind, String channel, String recipient,
			String text, boolean delivered, String providerResponse, Instant at) {
	}

	/**
	 * `kind`: order_confirmed, order_on_way, order_delivered, order_failed, new_order_email ve
	 * hesap e-postaları. `html` yalnızca e-postada; SMS'te null.
	 */
	public record Notification(String shopId, String orderId, String orderNumber, String kind, String channel,
			String recipient, String subject, String text, String html, String dedupeKey) {

		public static Notification sms(String shopId, String orderId, String orderNumber, String kind, String phone,
				String text, String dedupeKey) {
			return new Notification(shopId, orderId, orderNumber, kind, "sms", phone, null, text, null, dedupeKey);
		}
	}

	record Row(String channel, String recipient, String subject, String text, String html, int attempts) {
	}
}
