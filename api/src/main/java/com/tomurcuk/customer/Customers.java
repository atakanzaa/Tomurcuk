package com.tomurcuk.customer;

import com.tomurcuk.shared.Ids;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Müşteri kartı göndereni tutar; dükkân + telefon tekildir. */
@Service
public class Customers {

	private static final String UNNAMED = "İsimsiz müşteri";

	private final JdbcClient jdbc;

	Customers(JdbcClient jdbc) {
		this.jdbc = jdbc;
	}

	/**
	 * Telefonla müşteriyi bulur, yoksa açar. Aynı telefon farklı isimle gelirse kayıttaki isim
	 * kalır. Telefon {@code Phones.normalize} biçiminde gelir.
	 */
	@Transactional
	public String recordSender(String shopId, String phone, String name) {
		String displayName = name == null || name.isBlank() ? UNNAMED : name.strip();
		jdbc.sql("""
				INSERT INTO customer (id, shop_id, name, phone)
				VALUES (:id, :shopId, :name, :phone)
				ON CONFLICT (shop_id, phone) DO NOTHING
				""")
			.param("id", Ids.newId())
			.param("shopId", shopId)
			.param("name", displayName)
			.param("phone", phone)
			.update();
		return jdbc.sql("SELECT id FROM customer WHERE shop_id = :shopId AND phone = :phone")
			.param("shopId", shopId)
			.param("phone", phone)
			.query(String.class)
			.single();
	}
}
