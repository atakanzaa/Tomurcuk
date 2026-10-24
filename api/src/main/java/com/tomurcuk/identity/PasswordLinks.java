package com.tomurcuk.identity;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.HexFormat;
import java.util.Optional;

import com.tomurcuk.shared.FieldError;
import com.tomurcuk.shared.Ids;
import com.tomurcuk.shared.Instants;
import com.tomurcuk.shared.ValidationException;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Dükkân kullanıcısının şifresini belirlediği tek kullanımlık bağlantı (/sifre/<token>). Bağlantı
 * 7 gün geçerlidir; yenisi oluşunca kullanılmamış eskiler geçersiz olur. Veritabanında token'ın
 * kendisi değil SHA-256 özeti durur.
 */
@Service
public class PasswordLinks {

	static final Duration VALIDITY = Duration.ofDays(7);

	static final int MIN_PASSWORD = 10;

	private final JdbcClient jdbc;

	private final PasswordEncoder passwords;

	private final Clock clock;

	PasswordLinks(JdbcClient jdbc, PasswordEncoder passwords, Clock clock) {
		this.jdbc = jdbc;
		this.passwords = passwords;
		this.clock = clock;
	}

	/** Bağlantının sahibi; web sayfada "Ayla Er, Nergis Çiçek Atölyesi" diye gösterir. */
	public record Holder(String name, String email, String shopName) {
	}

	/** Yeni bağlantının token'ı; yalnızca bir kez döner, sonra okunamaz. */
	@Transactional
	public String issue(String userId) {
		Instant now = clock.instant();
		jdbc.sql("UPDATE password_token SET used_at = :now WHERE user_id = :userId AND used_at IS NULL")
			.param("now", Instants.sql(now))
			.param("userId", userId)
			.update();
		String token = Ids.token(32);
		jdbc.sql("INSERT INTO password_token (token_hash, user_id, expires_at) VALUES (:hash, :userId, :expires)")
			.param("hash", hash(token))
			.param("userId", userId)
			.param("expires", Instants.sql(now.plus(VALIDITY)))
			.update();
		return token;
	}

	/** Geçerli (kullanılmamış, süresi geçmemiş) bağlantının sahibi. */
	public Optional<Holder> holder(String token) {
		return jdbc.sql("""
				SELECT u.name, u.email, s.name AS shop_name
				FROM password_token t JOIN shop_user u ON u.id = t.user_id JOIN shop s ON s.id = u.shop_id
				WHERE t.token_hash = :hash AND t.used_at IS NULL AND t.expires_at > :now AND u.active
				""")
			.param("hash", hash(token))
			.param("now", Instants.sql(clock.instant()))
			.query((rs, n) -> new Holder(rs.getString("name"), rs.getString("email"), rs.getString("shop_name")))
			.optional();
	}

	/**
	 * Şifreyi kaydeder ve bağlantıyı kullanılmış sayar. Geçersiz bağlantı `token`
	 * (`link_invalid`), kısa şifre `password` (`password_short`, meta: min) hatası verir.
	 */
	@Transactional
	public void redeem(String token, String password) {
		if (password == null || password.length() < MIN_PASSWORD) {
			throw ValidationException.of("password",
					FieldError.of("password_short", java.util.Map.of("min", MIN_PASSWORD)));
		}
		Instant now = clock.instant();
		Optional<String> userId = jdbc.sql("""
				UPDATE password_token SET used_at = :now
				WHERE token_hash = :hash AND used_at IS NULL AND expires_at > :now
				RETURNING user_id
				""")
			.param("hash", hash(token == null ? "" : token))
			.param("now", Instants.sql(now))
			.query(String.class)
			.optional();
		if (userId.isEmpty()) {
			throw ValidationException.of("token", FieldError.of("link_invalid"));
		}
		jdbc.sql("UPDATE shop_user SET password_hash = :hash WHERE id = :id")
			.param("hash", passwords.encode(password))
			.param("id", userId.get())
			.update();
	}

	private static String hash(String token) {
		try {
			return HexFormat.of()
				.formatHex(MessageDigest.getInstance("SHA-256").digest(token.getBytes(StandardCharsets.UTF_8)));
		}
		catch (NoSuchAlgorithmException ex) {
			throw new IllegalStateException(ex);
		}
	}
}
