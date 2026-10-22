package com.tomurcuk.identity;

import java.util.List;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;

@Service
public class ShopUsers {

	private final JdbcClient jdbc;

	ShopUsers(JdbcClient jdbc) {
		this.jdbc = jdbc;
	}

	/** Dükkân sahiplerinin e-postaları; yeni sipariş e-postası bunlara gider. */
	public List<String> ownerEmails(String shopId) {
		return jdbc.sql("SELECT email FROM shop_user WHERE shop_id = :shopId AND role = 'owner' AND active ORDER BY created_at")
			.param("shopId", shopId)
			.query(String.class)
			.list();
	}
}
