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
import java.time.LocalDate;
import java.util.List;

import com.tomurcuk.MutableClock;
import com.tomurcuk.TestcontainersConfiguration;
import com.tomurcuk.discovery.Discovery;
import com.tomurcuk.discovery.ShopMatch;
import com.tomurcuk.identity.PlatformPrincipal;
import com.tomurcuk.identity.PlatformRole;
import com.tomurcuk.ordering.internal.Checkout;
import com.tomurcuk.shared.ValidationException;
import com.tomurcuk.shop.ShopStatus;
import com.tomurcuk.support.internal.ShopControl;
import com.tomurcuk.support.internal.ShopControl.StatusInput;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.AfterEach;
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

/** Destekten dükkân durumu: geçici kapatma, askıya alma, kalıcı kapatma ve etkileri. */
@SpringBootTest(properties = "tomurcuk.jobs.enabled=false")
@AutoConfigureMockMvc
@ActiveProfiles("demo")
@Import(TestcontainersConfiguration.class)
class ShopStatusTests {

	private static final String SHOP = "shop_nergis";

	private static final PlatformPrincipal LEAD = new PlatformPrincipal("pu_derya", "Derya Kaya", "derya@tomurcuk.app",
			PlatformRole.LEAD);

	private static final PlatformPrincipal AGENT = new PlatformPrincipal("pu_selin", "Selin Karaca",
			"selin@tomurcuk.app", PlatformRole.AGENT);

	@Autowired
	ShopControl control;

	@Autowired
	Checkout checkout;

	@Autowired
	Discovery discovery;

	@Autowired
	MutableClock clock;

	@Autowired
	MockMvc mvc;

	@Autowired
	JdbcClient jdbc;

	@BeforeEach
	void setUp() {
		clock.set(Instant.parse("2026-10-22T07:00:00Z"));
	}

	/** Örnek veri test sınıfları arasında paylaşılır; dükkân her testten sonra açılır. */
	@AfterEach
	void reopen() {
		jdbc.sql("UPDATE shop SET status = 'open', status_reason = '', paused_until = NULL WHERE id = :id")
			.param("id", SHOP)
			.update();
	}

	/** Temsilci geçici kapatır; süre bitince dükkân kendiliğinden sipariş alır. Askıya alamaz. */
	@Test
	void agentPausesUntilAGivenTime() {
		String until = clock.instant().plus(Duration.ofHours(2)).toString();
		assertThat(control.change(AGENT, SHOP, new StatusInput("paused", "Dükkân tadilatta", until, null)))
			.hasValueSatisfying(detail -> assertThat(detail.status()).isEqualTo(ShopStatus.PAUSED));

		assertThatThrownBy(() -> checkout.createDraft(SHOP, "p_mevsim", List.of("p_mevsim_o2")))
			.isInstanceOfSatisfying(ValidationException.class,
					ex -> assertThat(ex.getErrors().get("product").code()).isEqualTo("shop_unavailable"));
		assertThat(caferaga()).noneMatch(match -> match.slug().equals("nergis"));

		clock.set(clock.instant().plus(Duration.ofHours(3)));
		assertThat(checkout.createDraft(SHOP, "p_mevsim", List.of("p_mevsim_o2")).id()).isNotBlank();

		assertThatThrownBy(() -> control.change(AGENT, SHOP, new StatusInput("suspended", "Şikâyet", null, null)))
			.isInstanceOf(AccessDeniedException.class);
		assertThatThrownBy(() -> control.change(AGENT, SHOP, new StatusInput("paused", " ", null, null)))
			.isInstanceOfSatisfying(ValidationException.class,
					ex -> assertThat(ex.getErrors().get("reason").code()).isEqualTo("required"));
	}

	/** Askıdaki dükkânı temsilci açamaz; lider açar. Her değişiklik kayda ve sahibe e-postayla gider. */
	@Test
	void onlyLeadSuspendsAndReopens() {
		control.change(LEAD, SHOP, new StatusInput("suspended", "Ödeme şikâyetleri inceleniyor", null, null));
		assertThat(caferaga()).noneMatch(match -> match.slug().equals("nergis"));
		assertThatThrownBy(() -> control.change(AGENT, SHOP, new StatusInput("paused", "Deneme", null, null)))
			.isInstanceOf(AccessDeniedException.class);
		assertThatThrownBy(() -> control.change(AGENT, SHOP, new StatusInput("open", "", null, null)))
			.isInstanceOf(AccessDeniedException.class);
		assertThat(control.change(LEAD, SHOP, new StatusInput("open", "", null, null)))
			.hasValueSatisfying(detail -> assertThat(detail.status()).isEqualTo(ShopStatus.OPEN));

		assertThat(jdbc.sql("""
				SELECT count(*) FROM audit_log
				WHERE shop_id = :id AND action IN ('Dükkân askıya alındı', 'Dükkân yeniden açıldı')
				""").param("id", SHOP).query(Integer.class).single()).isGreaterThanOrEqualTo(2);
		await().atMost(Duration.ofSeconds(10))
			.until(() -> jdbc.sql("""
					SELECT count(*) FROM notification_log
					WHERE shop_id = :id AND kind = 'shop_status_email' AND subject LIKE '%askıya alındı'
					""").param("id", SHOP).query(Integer.class).single() > 0);
	}

	/** Açık siparişi olan dükkân onaysız kapatılmaz; kapanınca vitrin bulunmaz, panele girilmez. */
	@Test
	void closedShopDisappearsAndLocksThePanel() throws Exception {
		Cookie panel = sessionCookie();
		assertThatThrownBy(() -> control.change(LEAD, SHOP, new StatusInput("closed", "Sözleşme feshedildi", null, null)))
			.isInstanceOfSatisfying(ValidationException.class,
					ex -> assertThat(ex.getErrors().get("form").code()).isEqualTo("open_orders"));
		control.change(LEAD, SHOP, new StatusInput("closed", "Sözleşme feshedildi", null, true));

		mvc.perform(get("/api/public/shop-lookup/nergis")).andExpect(jsonPath("$.kind").value("missing"));
		mvc.perform(get("/api/public/shop-lookup/nergis-cicek-atolyesi")).andExpect(jsonPath("$.kind").value("missing"));
		login("ayla@nergiscicek.com").andExpect(status().isUnprocessableContent())
			.andExpect(jsonPath("$.errors.form.code").value("shop_closed"));
		mvc.perform(get("/api/panel/orders").cookie(panel)).andExpect(status().isUnauthorized());
	}

	private List<ShopMatch> caferaga() {
		return discovery.shops("Kadıköy", "Caferağa", LocalDate.parse("2026-10-24"));
	}

	private ResultActions login(String email) throws Exception {
		return mvc.perform(post("/api/panel/auth/login").contentType(MediaType.APPLICATION_JSON)
			.content("{\"email\":\"" + email + "\",\"password\":\"tomurcuk-demo\"}"));
	}

	/** Spring Session cookie'yi doğrudan Set-Cookie başlığıyla yazar; değer oradan okunur. */
	private Cookie sessionCookie() throws Exception {
		String header = login("ayla@nergiscicek.com").andExpect(status().isOk()).andReturn().getResponse()
			.getHeader("Set-Cookie");
		return new Cookie("TOMURCUK_SESSION", header.substring("TOMURCUK_SESSION=".length(), header.indexOf(';')));
	}
}
