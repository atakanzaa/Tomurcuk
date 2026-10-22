package com.tomurcuk.audit;

import java.time.Clock;
import java.time.Instant;
import java.util.List;

import com.tomurcuk.shared.Ids;
import com.tomurcuk.shared.Instants;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

/**
 * Denetim kaydı: kim, ne zaman, hangi dükkânda, ne yaptı, hangi kayıtta, gerekçesi. Yalnızca
 * eklenir; veritabanı tetikleyicisi güncellemeyi ve silmeyi reddeder.
 */
@Service
public class AuditLog {

	private final JdbcClient jdbc;

	private final Clock clock;

	AuditLog(JdbcClient jdbc, Clock clock) {
		this.jdbc = jdbc;
		this.clock = clock;
	}

	/** Çağıranın işlemine katılır; işlem geri alınırsa kayıt da düşmez diye ayrı tutulmaz. */
	@Transactional(propagation = Propagation.REQUIRED)
	public void record(Entry entry) {
		jdbc.sql("""
				INSERT INTO audit_log (id, actor_type, actor_id, actor_name, shop_id, action, record, reason, ip, at)
				VALUES (:id, :actorType, :actorId, :actorName, :shopId, :action, :record, :reason, :ip, :at)
				""")
			.param("id", Ids.newId())
			.param("actorType", entry.actorType())
			.param("actorId", entry.actorId())
			.param("actorName", entry.actorName())
			.param("shopId", entry.shopId())
			.param("action", entry.action())
			.param("record", entry.record())
			.param("reason", entry.reason())
			.param("ip", entry.ip())
			.param("at", Instants.sql(clock.instant()))
			.update();
	}

	/** Yeniden eskiye. `actorId` doluysa yalnızca o kişinin işlemleri. */
	public List<View> list(String actorId, int limit) {
		return jdbc.sql("""
				SELECT a.id, a.actor_name, s.name AS shop_name, a.action, a.record, a.reason, a.at
				FROM audit_log a LEFT JOIN shop s ON s.id = a.shop_id
				WHERE (CAST(:actorId AS varchar) IS NULL OR a.actor_id = :actorId)
				ORDER BY a.at DESC LIMIT :limit
				""")
			.param("actorId", actorId)
			.param("limit", limit)
			.query((rs, n) -> new View(rs.getString("id"), rs.getString("actor_name"), rs.getString("shop_name"),
					rs.getString("action"), rs.getString("record"), rs.getString("reason"),
					rs.getTimestamp("at").toInstant()))
			.list();
	}

	/** `actorType`: platform, shop, system. */
	public record Entry(String actorType, String actorId, String actorName, String shopId, String action,
			String record, String reason, String ip) {
	}

	/** web/lib/api/types.ts `AuditEntry` */
	public record View(String id, String actorName, String shopName, String action, String record, String reason,
			Instant at) {
	}
}
