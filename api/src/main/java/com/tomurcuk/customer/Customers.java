package com.tomurcuk.customer;

import java.time.Month;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;

import com.tomurcuk.shared.FieldError;
import com.tomurcuk.shared.Ids;
import com.tomurcuk.shared.Texts;
import com.tomurcuk.shared.ValidationException;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Müşteri kartı göndereni tutar; dükkân + telefon tekildir. */
@Service
public class Customers {

	private static final String UNNAMED = "İsimsiz müşteri";

	private static final Locale TR = Locale.forLanguageTag("tr");

	/** Bir müşteride en çok bu kadar özel gün. */
	static final int MAX_SPECIAL_DAYS = 20;

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

	/** "Annesinin doğum günü, 12 Mart"; yıl tutulmaz. `recipientName` isteğe bağlı. */
	public record SpecialDayInput(String title, Integer day, Integer month, String recipientName) {
	}

	/**
	 * Müşteri bu dükkânın değilse boş döner. Hatalar: `title` (`required`, `too_long`), `day`
	 * (`day_invalid`: o ayda olmayan gün; 29 Şubat geçerli), `recipientName` (`too_long`), `form`
	 * (`too_many`, meta: max).
	 */
	@Transactional
	public Optional<SpecialDay> addSpecialDay(String shopId, String customerId, SpecialDayInput input) {
		if (find(shopId, customerId).isEmpty()) {
			return Optional.empty();
		}
		Clean clean = validate(input);
		int count = jdbc.sql("SELECT count(*) FROM special_day WHERE customer_id = :customerId")
			.param("customerId", customerId)
			.query(Integer.class)
			.single();
		if (count >= MAX_SPECIAL_DAYS) {
			throw ValidationException.of("form", FieldError.of("too_many", Map.of("max", MAX_SPECIAL_DAYS)));
		}
		String id = Ids.newId();
		jdbc.sql("""
				INSERT INTO special_day (id, customer_id, title, day, month, recipient_name)
				VALUES (:id, :customerId, :title, :day, :month, :recipientName)
				""")
			.param("id", id)
			.param("customerId", customerId)
			.param("title", clean.title())
			.param("day", clean.day())
			.param("month", clean.month())
			.param("recipientName", clean.recipientName())
			.update();
		return Optional.of(new SpecialDay(id, customerId, clean.title(), clean.day(), clean.month(),
				clean.recipientName()));
	}

	/** Özel gün ya da müşteri bu dükkânın değilse boş döner; hatalar {@link #addSpecialDay} gibi. */
	@Transactional
	public Optional<SpecialDay> updateSpecialDay(String shopId, String customerId, String dayId,
			SpecialDayInput input) {
		Clean clean = validate(input);
		int updated = jdbc.sql("""
				UPDATE special_day d SET title = :title, day = :day, month = :month, recipient_name = :recipientName
				FROM customer c
				WHERE c.id = d.customer_id AND c.shop_id = :shopId AND c.id = :customerId AND d.id = :dayId
				""")
			.param("title", clean.title())
			.param("day", clean.day())
			.param("month", clean.month())
			.param("recipientName", clean.recipientName())
			.param("shopId", shopId)
			.param("customerId", customerId)
			.param("dayId", dayId)
			.update();
		return updated == 0 ? Optional.empty()
				: Optional.of(new SpecialDay(dayId, customerId, clean.title(), clean.day(), clean.month(),
						clean.recipientName()));
	}

	@Transactional
	public boolean deleteSpecialDay(String shopId, String customerId, String dayId) {
		return jdbc.sql("""
				DELETE FROM special_day d USING customer c
				WHERE c.id = d.customer_id AND c.shop_id = :shopId AND c.id = :customerId AND d.id = :dayId
				""")
			.param("shopId", shopId)
			.param("customerId", customerId)
			.param("dayId", dayId)
			.update() > 0;
	}

	private record Clean(String title, int day, int month, String recipientName) {
	}

	private static Clean validate(SpecialDayInput input) {
		SpecialDayInput in = input == null ? new SpecialDayInput(null, null, null, null) : input;
		Map<String, FieldError> errors = new LinkedHashMap<>();
		String title = Texts.check(errors, "title", in.title(), 160, true);
		String recipient = Texts.check(errors, "recipientName", in.recipientName(), 120, false);
		Integer day = in.day();
		Integer month = in.month();
		// Artık yıla göre: 29 Şubat geçerli, hatırlatma artık yıl olmayan yılda 28 Şubat'ta gelir.
		if (day == null || month == null || month < 1 || month > 12 || day < 1
				|| day > Month.of(month).maxLength()) {
			errors.put("day", FieldError.of("day_invalid"));
		}
		if (!errors.isEmpty()) {
			throw new ValidationException(errors);
		}
		return new Clean(title, day, month, recipient.isEmpty() ? null : recipient);
	}
}
