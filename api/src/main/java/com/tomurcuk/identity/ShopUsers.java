package com.tomurcuk.identity;

import java.time.Instant;
import java.util.List;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;

@Service
public class ShopUsers {

	private final JdbcClient jdbc;

	ShopUsers(JdbcClient jdbc) {
		this.jdbc = jdbc;
	}

	/** Dükkânın kullanıcıları; JSON'u web/lib/api/types.ts `ShopUser`. */
	public List<View> ofShop(String shopId) {
		return jdbc.sql("SELECT id, shop_id, name, email, role, last_seen_at FROM shop_user WHERE shop_id = :shopId AND active ORDER BY role DESC, name")
			.param("shopId", shopId)
			.query((rs, n) -> new View(rs.getString("id"), rs.getString("shop_id"), rs.getString("name"),
					rs.getString("email"), ShopRole.fromCode(rs.getString("role")),
					rs.getTimestamp("last_seen_at") == null ? null : rs.getTimestamp("last_seen_at").toInstant()))
			.list();
	}

	public record View(String id, String shopId, String name, String email, ShopRole role, Instant lastSeenAt) {
	}

	/** Dükkân sahiplerinin e-postaları; yeni sipariş e-postası bunlara gider. */
	public List<String> ownerEmails(String shopId) {
		return jdbc.sql("SELECT email FROM shop_user WHERE shop_id = :shopId AND role = 'owner' AND active ORDER BY created_at")
			.param("shopId", shopId)
			.query(String.class)
			.list();
	}
}
