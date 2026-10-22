package com.tomurcuk.identity.internal;

import java.time.Instant;
import java.util.Optional;

import com.tomurcuk.identity.ShopRole;
import com.tomurcuk.shared.Instants;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

@Repository
class ShopUserStore {

	private final JdbcClient jdbc;

	ShopUserStore(JdbcClient jdbc) {
		this.jdbc = jdbc;
	}

	Optional<ShopUser> findActiveByEmail(String email) {
		return jdbc.sql("""
				SELECT u.id, u.shop_id, u.name, u.email, u.password_hash, u.role, u.last_seen_at
				FROM shop_user u JOIN shop s ON s.id = u.shop_id
				WHERE u.email = :email AND u.active
				""")
			.param("email", email)
			.query((rs, n) -> new ShopUser(rs.getString("id"), rs.getString("shop_id"), rs.getString("name"),
					rs.getString("email"), rs.getString("password_hash"), ShopRole.fromCode(rs.getString("role")),
					rs.getTimestamp("last_seen_at") == null ? null : rs.getTimestamp("last_seen_at").toInstant()))
			.optional();
	}

	Optional<Instant> lastSeen(String userId) {
		return jdbc.sql("SELECT last_seen_at FROM shop_user WHERE id = :id")
			.param("id", userId)
			.query((rs, n) -> rs.getTimestamp("last_seen_at") == null ? null : rs.getTimestamp("last_seen_at").toInstant())
			.optional();
	}

	void touch(String userId, Instant at) {
		jdbc.sql("UPDATE shop_user SET last_seen_at = :at WHERE id = :id")
			.param("at", Instants.sql(at))
			.param("id", userId)
			.update();
	}

	record ShopUser(String id, String shopId, String name, String email, String passwordHash, ShopRole role,
			Instant lastSeenAt) {
	}
}
