package com.tomurcuk.identity.internal;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import com.tomurcuk.identity.PlatformRole;
import com.tomurcuk.shared.Instants;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

@Repository
class PlatformUserStore {

	private final JdbcClient jdbc;

	PlatformUserStore(JdbcClient jdbc) {
		this.jdbc = jdbc;
	}

	Optional<PlatformUser> findActiveByEmail(String email) {
		return jdbc.sql("SELECT id, name, email, password_hash, totp_secret, role FROM platform_user WHERE email = :email AND active")
			.param("email", email)
			.query((rs, n) -> new PlatformUser(rs.getString("id"), rs.getString("name"), rs.getString("email"),
					rs.getString("password_hash"), rs.getString("totp_secret"), PlatformRole.fromCode(rs.getString("role"))))
			.optional();
	}

	List<PlatformUser> active() {
		return jdbc.sql("SELECT id, name, email, password_hash, totp_secret, role FROM platform_user WHERE active ORDER BY name")
			.query((rs, n) -> new PlatformUser(rs.getString("id"), rs.getString("name"), rs.getString("email"), null,
					null, PlatformRole.fromCode(rs.getString("role"))))
			.list();
	}

	void touch(String userId, Instant at) {
		jdbc.sql("UPDATE platform_user SET last_seen_at = :at WHERE id = :id")
			.param("at", Instants.sql(at))
			.param("id", userId)
			.update();
	}

	record PlatformUser(String id, String name, String email, String passwordHash, String totpSecret,
			PlatformRole role) {
	}
}
