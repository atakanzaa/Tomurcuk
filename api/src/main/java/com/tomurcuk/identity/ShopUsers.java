package com.tomurcuk.identity;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.regex.Pattern;

import com.tomurcuk.shared.FieldError;
import com.tomurcuk.shared.Ids;
import com.tomurcuk.shared.Texts;
import com.tomurcuk.shared.ValidationException;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ShopUsers {

	private static final Pattern EMAIL = Pattern.compile("[^@\\s]+@[^@\\s]+\\.[^@\\s]+");

	private final JdbcClient jdbc;

	private final PasswordEncoder passwords;

	ShopUsers(JdbcClient jdbc, PasswordEncoder passwords) {
		this.jdbc = jdbc;
		this.passwords = passwords;
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

	/**
	 * Dükkânın sahibini açar. Şifre tahmin edilemez rastgele bir değerdir; sahibi şifresini
	 * `PasswordLinks` bağlantısıyla belirler. Hatalar `ownerName`, `ownerEmail` alanlarında;
	 * e-posta başka hesapta varsa `email_taken`.
	 */
	@Transactional
	public String createOwner(String shopId, String name, String email) {
		Map<String, FieldError> errors = new LinkedHashMap<>();
		String cleanName = Texts.check(errors, "ownerName", name, 120, true);
		String cleanEmail = Texts.check(errors, "ownerEmail", email, 160, true).toLowerCase(Locale.ROOT);
		if (!errors.containsKey("ownerEmail")) {
			if (!EMAIL.matcher(cleanEmail).matches()) {
				errors.put("ownerEmail", FieldError.of("email_invalid"));
			}
			else if (jdbc.sql("SELECT count(*) FROM shop_user WHERE email = :email")
				.param("email", cleanEmail)
				.query(Integer.class)
				.single() > 0) {
				errors.put("ownerEmail", FieldError.of("email_taken"));
			}
		}
		if (!errors.isEmpty()) {
			throw new ValidationException(errors);
		}
		String id = Ids.newId();
		jdbc.sql("""
				INSERT INTO shop_user (id, shop_id, name, email, password_hash, role)
				VALUES (:id, :shopId, :name, :email, :hash, 'owner')
				""")
			.param("id", id)
			.param("shopId", shopId)
			.param("name", cleanName)
			.param("email", cleanEmail)
			.param("hash", passwords.encode(Ids.token(32)))
			.update();
		return id;
	}

	/** Dükkânın sahibi; şifre bağlantısı ona oluşturulur. */
	public Optional<View> owner(String shopId) {
		return ofShop(shopId).stream().filter(u -> u.role() == ShopRole.OWNER).findFirst();
	}

	/** Dükkân sahiplerinin e-postaları; yeni sipariş e-postası bunlara gider. */
	public List<String> ownerEmails(String shopId) {
		return jdbc.sql("SELECT email FROM shop_user WHERE shop_id = :shopId AND role = 'owner' AND active ORDER BY created_at")
			.param("shopId", shopId)
			.query(String.class)
			.list();
	}
}
