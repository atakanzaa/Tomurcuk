package com.tomurcuk.support;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.awaitility.Awaitility.await;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Duration;
import java.time.Instant;

import com.tomurcuk.MutableClock;
import com.tomurcuk.TestcontainersConfiguration;
import com.tomurcuk.identity.PlatformPrincipal;
import com.tomurcuk.identity.PlatformRole;
import com.tomurcuk.shared.Ids;
import com.tomurcuk.shared.ValidationException;
import com.tomurcuk.support.internal.Onboarding;
import com.tomurcuk.support.internal.Onboarding.OpenShopInput;
import com.tomurcuk.support.internal.Onboarding.PasswordLink;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

/** Destek panelinden dükkân açma ve sahibin bağlantıyla şifre belirlemesi. */
@SpringBootTest(properties = "tomurcuk.jobs.enabled=false")
@AutoConfigureMockMvc
@ActiveProfiles("demo")
@Import(TestcontainersConfiguration.class)
class OnboardingTests {

	private static final PlatformPrincipal LEAD = new PlatformPrincipal("pu_derya", "Derya Kaya", "derya@tomurcuk.app",
			PlatformRole.LEAD);

	private static final PlatformPrincipal AGENT = new PlatformPrincipal("pu_selin", "Selin Karaca",
			"selin@tomurcuk.app", PlatformRole.AGENT);

	@Autowired
	Onboarding onboarding;

	@Autowired
	MockMvc mvc;

	@Autowired
	MutableClock clock;

	@Autowired
	JdbcClient jdbc;

	String suffix;

	@BeforeEach
	void setUp() {
		clock.set(Instant.parse("2026-10-22T07:00:00Z"));
		suffix = Ids.token(6).toLowerCase();
	}

	@Test
	void leadOpensShopAndOwnerSetsPassword() throws Exception {
		PasswordLink link = onboarding.open(LEAD, input("papatya-" + suffix, "sahip-" + suffix + "@ornek.com"));
		String token = link.url().substring(link.url().lastIndexOf('/') + 1);
		assertThat(link.slug()).isEqualTo("papatya-" + suffix);

		mvc.perform(get("/api/public/password-setup/{token}", token))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.name").value("Gül Demir"))
			.andExpect(jsonPath("$.shopName").value("Papatya Çiçekçilik"));
		setPassword(token, "kisa").andExpect(status().isUnprocessableContent())
			.andExpect(jsonPath("$.errors.password.code").value("password_short"));
		setPassword(token, "gizli-sifre-123").andExpect(status().isNoContent());
		// Bağlantı tek kullanımlık.
		setPassword(token, "baska-sifre-456").andExpect(status().isUnprocessableContent())
			.andExpect(jsonPath("$.errors.token.code").value("link_invalid"));

		mvc.perform(post("/api/panel/auth/login").contentType(MediaType.APPLICATION_JSON)
			.content("{\"email\":\"sahip-" + suffix + "@ornek.com\",\"password\":\"gizli-sifre-123\"}"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.shop.slug").value("papatya-" + suffix));
		assertThat(jdbc.sql("SELECT count(*) FROM time_slot WHERE shop_id = :id AND active")
			.param("id", link.shopId())
			.query(Integer.class)
			.single()).isEqualTo(3);
		assertThat(jdbc.sql("SELECT count(*) FROM audit_log WHERE shop_id = :id AND action = 'Dükkân açıldı'")
			.param("id", link.shopId())
			.query(Integer.class)
			.single()).isEqualTo(1);
		// Bağlantı sahibine e-postayla da gider.
		await().atMost(Duration.ofSeconds(10))
			.until(() -> jdbc.sql("""
					SELECT count(*) FROM notification_log
					WHERE kind = 'password_link_email' AND recipient = :email AND position(:url in text) > 0
					""")
				.param("email", "sahip-" + suffix + "@ornek.com")
				.param("url", link.url())
				.query(Integer.class)
				.single() == 1);
	}

	/** Süresi geçen ya da yenisi oluşturulan bağlantı çalışmaz. */
	@Test
	void oldOrExpiredLinkDoesNotWork() throws Exception {
		PasswordLink first = onboarding.open(LEAD, input("lale-" + suffix, "lale-" + suffix + "@ornek.com"));
		PasswordLink second = onboarding.newPasswordLink(LEAD, first.shopId()).orElseThrow();
		mvc.perform(get("/api/public/password-setup/{token}", token(first))).andExpect(status().isNotFound());
		mvc.perform(get("/api/public/password-setup/{token}", token(second))).andExpect(status().isOk());
		clock.set(clock.instant().plus(Duration.ofDays(8)));
		setPassword(token(second), "gizli-sifre-123").andExpect(status().isUnprocessableContent());
	}

	@Test
	void agentCannotOpenShop() {
		assertThatThrownBy(() -> onboarding.open(AGENT, input("gul-" + suffix, "gul-" + suffix + "@ornek.com")))
			.isInstanceOf(AccessDeniedException.class);
	}

	/** Var olan, ayrılmış ya da biçimi bozuk adres; başka hesaptaki e-posta. */
	@Test
	void slugAndEmailMustBeFree() {
		assertThatThrownBy(() -> onboarding.open(LEAD, input("nergis", "yeni-" + suffix + "@ornek.com")))
			.isInstanceOfSatisfying(ValidationException.class,
					ex -> assertThat(ex.getErrors().get("slug").code()).isEqualTo("slug_taken"));
		assertThatThrownBy(() -> onboarding.open(LEAD, input("panel", "yeni-" + suffix + "@ornek.com")))
			.isInstanceOfSatisfying(ValidationException.class,
					ex -> assertThat(ex.getErrors().get("slug").code()).isEqualTo("slug_invalid"));
		assertThatThrownBy(() -> onboarding.open(LEAD, input("yeni-" + suffix, "ayla@nergiscicek.com")))
			.isInstanceOfSatisfying(ValidationException.class,
					ex -> assertThat(ex.getErrors().get("ownerEmail").code()).isEqualTo("email_taken"));
		// E-posta hatasında dükkân da açılmaz.
		assertThat(jdbc.sql("SELECT count(*) FROM shop WHERE slug = :slug")
			.param("slug", "yeni-" + suffix)
			.query(Integer.class)
			.single()).isZero();
	}

	private OpenShopInput input(String slug, String email) {
		return new OpenShopInput(null, "Papatya Çiçekçilik", "Papatya", slug, "0532 111 22 33",
				"Moda Cad. No: 1, Kadıköy", "Gül Demir", email);
	}

	private static String token(PasswordLink link) {
		return link.url().substring(link.url().lastIndexOf('/') + 1);
	}

	private ResultActions setPassword(String token, String password) throws Exception {
		return mvc.perform(post("/api/public/password-setup").contentType(MediaType.APPLICATION_JSON)
			.content("{\"token\":\"" + token + "\",\"password\":\"" + password + "\"}"));
	}
}
