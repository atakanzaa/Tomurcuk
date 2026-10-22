package com.tomurcuk.customer;

import java.util.List;
import java.util.Locale;
import java.util.Optional;

import com.tomurcuk.shared.Ids;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Müşteri kartı göndereni tutar; dükkân + telefon tekildir. */
@Service
public class Customers {

	private static final String UNNAMED = "İsimsiz müşteri";

	private static final Locale TR = Locale.forLanguageTag("tr");

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

	public Optional<CustomerRecord> find(String shopId, String customerId) {
		return jdbc.sql("SELECT * FROM customer WHERE shop_id = :shopId AND id = :id")
			.param("shopId", shopId)
			.param("id", customerId)
			.query(CustomerRecord.class)
			.optional();
	}

	/** Telefon {@code Phones.normalize} biçiminde gelir. */
	public Optional<CustomerRecord> findByPhone(String shopId, String phone) {
		return jdbc.sql("SELECT * FROM customer WHERE shop_id = :shopId AND phone = :phone")
			.param("shopId", shopId)
			.param("phone", phone)
			.query(CustomerRecord.class)
			.optional();
	}

	/**
	 * Ada göre (Türkçe küçük harfle, içinde geçen) ya da en az 3 haneyle telefona göre arar. Boş
	 * sorgu bütün müşterileri döner. Dükkân başına müşteri sayısı küçük olduğu için süzme uygulamada.
	 */
	public List<CustomerRecord> search(String shopId, String query) {
		String text = query == null ? "" : query.strip().toLowerCase(TR);
		String digits = text.replaceAll("\\D", "");
		return jdbc.sql("SELECT * FROM customer WHERE shop_id = :shopId")
			.param("shopId", shopId)
			.query(CustomerRecord.class)
			.list()
			.stream()
			.filter(c -> text.isEmpty() || c.name().toLowerCase(TR).contains(text)
					|| (digits.length() >= 3 && c.phone().replaceAll("\\D", "").contains(digits)))
			.toList();
	}

	public List<SpecialDay> specialDays(String customerId) {
		return jdbc.sql("SELECT * FROM special_day WHERE customer_id = :customerId ORDER BY month, day")
			.param("customerId", customerId)
			.query(SpecialDay.class)
			.list();
	}

	public List<SpecialDay> specialDaysOfShop(String shopId) {
		return jdbc.sql("""
				SELECT d.* FROM special_day d JOIN customer c ON c.id = d.customer_id
				WHERE c.shop_id = :shopId
				""")
			.param("shopId", shopId)
			.query(SpecialDay.class)
			.list();
	}
}
