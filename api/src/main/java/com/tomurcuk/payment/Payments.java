package com.tomurcuk.payment;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

import com.tomurcuk.shared.Instants;
import com.tomurcuk.shared.Ids;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;

/**
 * Kart ödemeleri. Her deneme ayrı satırdır; sonuç aynı token için birden çok kez gelebilir
 * (callback tekrarı, zamanlanmış sorgu). Satır `pending`'den yalnızca bir kez çıkar ve
 * {@link PaymentSucceeded} yalnızca o geçişte yayınlanır.
 */
@Service
public class Payments {

	private static final Logger log = LoggerFactory.getLogger(Payments.class);

	private final JdbcClient jdbc;

	private final PaymentProvider provider;

	private final ApplicationEventPublisher events;

	private final Clock clock;

	private final TransactionTemplate tx;

	Payments(JdbcClient jdbc, PaymentProvider provider, ApplicationEventPublisher events, Clock clock,
			TransactionTemplate tx) {
		this.jdbc = jdbc;
		this.provider = provider;
		this.events = events;
		this.clock = clock;
		this.tx = tx;
	}

	/**
	 * Sağlayıcıda ödeme oturumu açar; alıcı dönen sayfaya yönlenir. Siparişin önceki bekleyen
	 * oturumları bırakılır: zamanlanmış sorgu yalnızca son oturumu sorar.
	 */
	@Transactional
	public PaymentProvider.Session start(PaymentProvider.Request request) {
		PaymentProvider.Session session = provider.start(request);
		Instant now = clock.instant();
		jdbc.sql("UPDATE payment SET status = 'abandoned', updated_at = :now WHERE order_id = :orderId AND status = 'pending'")
			.param("now", Instants.sql(now))
			.param("orderId", request.conversationId())
			.update();
		jdbc.sql("""
				INSERT INTO payment (id, order_id, shop_id, provider, token, amount, status, created_at, updated_at)
				VALUES (:id, :orderId, :shopId, :provider, :token, :amount, 'pending', :now, :now)
				""")
			.param("id", Ids.newId())
			.param("orderId", request.conversationId())
			.param("shopId", request.shopId())
			.param("provider", provider.name())
			.param("token", session.token())
			.param("amount", request.amount())
			.param("now", Instants.sql(now))
			.update();
		return session;
	}

	/**
	 * Token'ın sonucunu sağlayıcıdan alıp kaydeder. Bilinmeyen token boş döner. Ödenen tutar
	 * beklenenle uyuşmazsa ödeme başarısız sayılır. Sağlayıcı çağrısı veritabanı işleminin
	 * dışındadır; kayıt ve {@link PaymentSucceeded} dinleyicileri tek işlemde çalışır.
	 */
	public Optional<Outcome> complete(String token) {
		Optional<Pending> payment = find(token);
		if (payment.isEmpty()) {
			return Optional.empty();
		}
		if (!payment.get().isOpen()) {
			return Optional.of(new Outcome(payment.get().orderId(), payment.get().status().equals("succeeded")));
		}
		PaymentProvider.Result result = provider.fetch(token);
		return Optional.of(record(payment.get(), result));
	}

	/** Siparişin bekleyen ödemelerini bırakır (30 dakikada tamamlanmayan ödeme). */
	@Transactional
	public void abandon(String orderId) {
		jdbc.sql("""
				UPDATE payment SET status = 'abandoned', updated_at = :now
				WHERE order_id = :orderId AND status = 'pending'
				""")
			.param("now", Instants.sql(clock.instant()))
			.param("orderId", orderId)
			.update();
	}

	/** Siparişin bekleyen ödemelerini sağlayıcıya sorar; biri ödenmişse kaydeder. */
	public void reconcileOrder(String orderId) {
		jdbc.sql("SELECT token FROM payment WHERE order_id = :orderId AND status = 'pending'")
			.param("orderId", orderId)
			.query(String.class)
			.list()
			.forEach(token -> {
				try {
					complete(token);
				}
				catch (RuntimeException ex) {
					log.warn("Ödeme durumu sorgulanamadı: sipariş {}", orderId, ex);
				}
			});
	}

	/** Callback'i gelmemiş ödemeleri sağlayıcıya sorar (zamanlanmış iş). */
	public int reconcile(Duration olderThan) {
		List<Pending> pending = jdbc.sql("""
				SELECT id, order_id, shop_id, token, amount, status FROM payment
				WHERE status = 'pending' AND created_at < :before
				ORDER BY created_at
				LIMIT 100
				""")
			.param("before", Instants.sql(clock.instant().minus(olderThan)))
			.query(Pending.class)
			.list();
		int settled = 0;
		for (Pending payment : pending) {
			try {
				PaymentProvider.Result result = provider.fetch(payment.token());
				if (result.status() != PaymentProvider.Status.PENDING) {
					record(payment, result);
					settled++;
				}
			}
			catch (RuntimeException ex) {
				log.warn("Ödeme durumu sorgulanamadı: {}", payment.id(), ex);
			}
		}
		return settled;
	}

	private Optional<Pending> find(String token) {
		return jdbc.sql("SELECT id, order_id, shop_id, token, amount, status FROM payment WHERE token = :token")
			.param("token", token)
			.query(Pending.class)
			.optional();
	}

	private Outcome record(Pending payment, PaymentProvider.Result result) {
		return tx.execute(status -> recordInTransaction(payment, result));
	}

	/**
	 * Satırı açık halden (`pending`, `abandoned`) çıkaran tek UPDATE; aynı anda gelen iki sonuçtan
	 * yalnızca biri satırı değiştirir ve olayı yalnızca o yayınlar. `provider_ref` tekildir.
	 * Bırakılmış oturum sonradan başarıyla dönerse para çekilmiştir; ödeme yine kaydedilir.
	 */
	private Outcome recordInTransaction(Pending payment, PaymentProvider.Result result) {
		boolean succeeded = result.status() == PaymentProvider.Status.SUCCEEDED
				&& result.paidAmount() == payment.amount();
		if (result.status() == PaymentProvider.Status.SUCCEEDED && !succeeded) {
			log.error("Ödenen tutar beklenenden farklı: ödeme {}, beklenen {}, gelen {}", payment.id(),
					payment.amount(), result.paidAmount());
		}
		if (result.status() == PaymentProvider.Status.PENDING) {
			return new Outcome(payment.orderId(), false);
		}
		int changed = jdbc.sql("""
				UPDATE payment SET status = :status, provider_ref = :ref, raw_response = CAST(:raw AS jsonb),
				       updated_at = :now
				WHERE id = :id AND status IN ('pending', 'abandoned')
				""")
			.param("status", succeeded ? "succeeded" : "failed")
			.param("ref", result.providerRef())
			.param("raw", result.rawResponse())
			.param("now", Instants.sql(clock.instant()))
			.param("id", payment.id())
			.update();
		if (changed == 1 && succeeded) {
			events.publishEvent(new PaymentSucceeded(payment.orderId(), payment.shopId(), payment.id()));
		}
		if (changed == 0) {
			String status = jdbc.sql("SELECT status FROM payment WHERE id = :id")
				.param("id", payment.id())
				.query(String.class)
				.single();
			return new Outcome(payment.orderId(), status.equals("succeeded"));
		}
		return new Outcome(payment.orderId(), succeeded);
	}

	/** Siparişin ödeme denemeleri, eskiden yeniye (destek zaman çizelgesi). */
	public List<Attempt> history(String orderId) {
		return jdbc.sql("SELECT provider, amount, status, updated_at FROM payment WHERE order_id = :orderId ORDER BY created_at")
			.param("orderId", orderId)
			.query((rs, n) -> new Attempt(rs.getString("provider"), rs.getLong("amount"), rs.getString("status"),
					rs.getTimestamp("updated_at").toInstant()))
			.list();
	}

	public record Outcome(String orderId, boolean succeeded) {
	}

	/** `status`: pending, succeeded, failed, abandoned. */
	public record Attempt(String provider, long amount, String status, Instant at) {
	}

	record Pending(String id, String orderId, String shopId, String token, long amount, String status) {

		/** Sonucu henüz kesinleşmemiş: bekleyen ya da yeni oturum açıldığı için bırakılmış. */
		boolean isOpen() {
			return status.equals("pending") || status.equals("abandoned");
		}
	}
}
