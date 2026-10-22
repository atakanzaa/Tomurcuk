package com.tomurcuk.identity;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Optional;

import com.tomurcuk.audit.AuditLog;
import com.tomurcuk.shared.Ids;
import com.tomurcuk.shared.Instants;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Destek ekibinin dükkân adına açtığı oturum: gerekçe zorunlu, 30 dakika sürer, dükkân
 * sahiplerine bildirim gider ve açılış, kapanış ve oturumdaki her değişiklik denetim kaydına
 * yazılır. Süresi dolan oturumla yapılan istek reddedilir.
 */
@Service
public class Impersonations {

	public static final Duration DURATION = Duration.ofMinutes(30);

	private final JdbcClient jdbc;

	private final AuditLog audit;

	private final ApplicationEventPublisher events;

	private final Clock clock;

	Impersonations(JdbcClient jdbc, AuditLog audit, ApplicationEventPublisher events, Clock clock) {
		this.jdbc = jdbc;
		this.audit = audit;
		this.events = events;
		this.clock = clock;
	}

	@Transactional
	public Impersonation start(PlatformPrincipal user, String shopId, String shopName, String reason) {
		Instant now = clock.instant();
		Impersonation impersonation = new Impersonation(Ids.token(20), user.name(), shopId, reason.strip(), now,
				now.plus(DURATION));
		jdbc.sql("""
				INSERT INTO impersonation_session (id, platform_user_id, shop_id, reason, started_at, ends_at)
				VALUES (:id, :userId, :shopId, :reason, :startedAt, :endsAt)
				""")
			.param("id", impersonation.id())
			.param("userId", user.userId())
			.param("shopId", shopId)
			.param("reason", impersonation.reason())
			.param("startedAt", Instants.sql(now))
			.param("endsAt", Instants.sql(impersonation.endsAt()))
			.update();
		audit.record(new AuditLog.Entry("platform", user.userId(), user.name(), shopId, "Dükkân adına giriş",
				DURATION.toMinutes() + " dakikalık oturum", impersonation.reason(), null));
		events.publishEvent(new ImpersonationStarted(impersonation.id(), shopId, user.name(), impersonation.reason()));
		return impersonation;
	}

	/** Oturumu açan kullanıcının, süresi dolmamış ve kapatılmamış oturumu. */
	public Optional<Impersonation> findActive(String impersonationId, String platformUserId) {
		return jdbc.sql("""
				SELECT i.id, u.name AS support_user_name, i.shop_id, i.reason, i.started_at, i.ends_at
				FROM impersonation_session i JOIN platform_user u ON u.id = i.platform_user_id
				WHERE i.id = :id AND i.platform_user_id = :userId AND i.ended_at IS NULL AND i.ends_at > :now
				""")
			.param("id", impersonationId)
			.param("userId", platformUserId)
			.param("now", Instants.sql(clock.instant()))
			.query((rs, n) -> new Impersonation(rs.getString("id"), rs.getString("support_user_name"),
					rs.getString("shop_id"), rs.getString("reason"), rs.getTimestamp("started_at").toInstant(),
					rs.getTimestamp("ends_at").toInstant()))
			.optional();
	}

	@Transactional
	public void end(String impersonationId, PlatformPrincipal user) {
		int ended = jdbc.sql("""
				UPDATE impersonation_session SET ended_at = :now
				WHERE id = :id AND platform_user_id = :userId AND ended_at IS NULL
				""")
			.param("now", Instants.sql(clock.instant()))
			.param("id", impersonationId)
			.param("userId", user.userId())
			.update();
		if (ended == 1) {
			String shopId = jdbc.sql("SELECT shop_id FROM impersonation_session WHERE id = :id")
				.param("id", impersonationId)
				.query(String.class)
				.single();
			audit.record(new AuditLog.Entry("platform", user.userId(), user.name(), shopId,
					"Dükkân adına giriş bitirildi", "Oturum kapatıldı", null, null));
		}
	}
}
