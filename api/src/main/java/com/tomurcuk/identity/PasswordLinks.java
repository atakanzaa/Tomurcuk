package com.tomurcuk.identity;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.HexFormat;
import java.util.Locale;
import java.util.Optional;

import com.tomurcuk.shared.FieldError;
import com.tomurcuk.shared.Ids;
import com.tomurcuk.shared.Instants;
import com.tomurcuk.shared.ValidationException;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Dükkân kullanıcısının şifresini belirlediği tek kullanımlık bağlantı (/sifre/<token>). Destek
 * ekibinin oluşturduğu kurulum bağlantısı 7 gün, giriş ekranından istenen sıfırlama bağlantısı 1
 * saat geçerlidir; yenisi oluşunca kullanılmamış eskiler geçersiz olur. Veritabanında token'ın
 * kendisi değil SHA-256 özeti durur.
 */
@Service
public class PasswordLinks {

	static final Duration VALIDITY = Duration.ofDays(7);

	static final Duration RESET_VALIDITY = Duration.ofHours(1);

	/** Aynı kullanıcıya bu süre içinde ikinci sıfırlama bağlantısı gönderilmez. */
	static final Duration RESET_INTERVAL = Duration.ofMinutes(2);

	static final int MIN_PASSWORD = 10;

	private final JdbcClient jdbc;

	private final PasswordEncoder passwords;

	private final Clock clock;

	private final ApplicationEventPublisher events;

	PasswordLinks(JdbcClient jdbc, PasswordEncoder passwords, Clock clock, ApplicationEventPublisher events) {
		this.jdbc = jdbc;
		this.passwords = passwords;
		this.clock = clock;
		this.events = events;
	}

	/** Bağlantının sahibi; web sayfada "Ayla Er, Nergis Çiçek Atölyesi" diye gösterir. */
	public record Holder(String name, String email, String shopName) {
	}

	/**
	 * Yeni kurulum bağlantısının token'ı; yalnızca bir kez döner, sonra okunamaz. Kullanıcıya
	 * e-postayla da gider (`PasswordLinkIssued`).
	 */
	@Transactional
	public String issue(String userId) {
		return issue(userId, VALIDITY, PasswordLinkIssued.SETUP);
	}

	/**
	 * Giriş ekranındaki "Şifrenizi mi unuttunuz?": e-posta etkin bir dükkân kullanıcısınınsa
	 * sıfırlama bağlantısı e-postayla gider. Son 2 dakikada bağlantı gönderildiyse yenisi
	 * gönderilmez. Sonuç dışarıya söylenmez; hangi adresin kayıtlı olduğu anlaşılmasın.
	 */
	@Transactional
	public void requestReset(String email) {
		String clean = email == null ? "" : email.strip().toLowerCase(Locale.ROOT);
		if (clean.isEmpty()) {
			return;
		}
		Instant now = clock.instant();
		jdbc.sql("""
				SELECT u.id FROM shop_user u
				WHERE u.email = :email AND u.active AND NOT EXISTS (
				    SELECT 1 FROM password_token t WHERE t.user_id = u.id AND t.created_at > :since)
				""")
			.param("email", clean)
			.param("since", Instants.sql(now.minus(RESET_INTERVAL)))
			.query(String.class)
			.optional()
			.ifPresent(userId -> issue(userId, RESET_VALIDITY, PasswordLinkIssued.RESET));
	}

	private String issue(String userId, Duration validity, String purpose) {
		Instant now = clock.instant();
		jdbc.sql("UPDATE password_token SET used_at = :now WHERE user_id = :userId AND used_at IS NULL")
			.param("now", Instants.sql(now))
			.param("userId", userId)
			.update();
		String token = Ids.token(32);
		jdbc.sql("""
				INSERT INTO password_token (token_hash, user_id, expires_at, created_at)
				VALUES (:hash, :userId, :expires, :now)
				""")
			.param("hash", hash(token))
			.param("userId", userId)
			.param("expires", Instants.sql(now.plus(validity)))
			.param("now", Instants.sql(now))
			.update();
		jdbc.sql("""
				SELECT u.shop_id, u.name, u.email, s.name AS shop_name
				FROM shop_user u JOIN shop s ON s.id = u.shop_id WHERE u.id = :userId
				""")
			.param("userId", userId)
			.query((rs, n) -> new PasswordLinkIssued(Ids.newId(), rs.getString("shop_id"), rs.getString("name"),
					rs.getString("email"), rs.getString("shop_name"), token, purpose))
			.optional()
			.ifPresent(events::publishEvent);
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
