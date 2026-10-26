package com.tomurcuk.support;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Duration;
import java.time.Instant;

import com.jayway.jsonpath.JsonPath;
import com.tomurcuk.MutableClock;
import com.tomurcuk.TestcontainersConfiguration;
import com.tomurcuk.identity.internal.TotpCodes;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

/** Destek: iki adımlı giriş, maskeli veri, dükkân adına oturum ve denetim kaydı. */
@SpringBootTest(properties = "tomurcuk.jobs.enabled=false")
@AutoConfigureMockMvc
@ActiveProfiles("demo")
@Import(TestcontainersConfiguration.class)
class SupportTests {

	private static final String TOTP_SECRET = "JBSWY3DPEHPK3PXP";

	private static final String IMPERSONATION = "X-Tomurcuk-Impersonation";

	@Autowired
	MockMvc mvc;

	@Autowired
	MutableClock clock;

	@Autowired
	JdbcClient jdbc;

	@BeforeEach
	void resetClock() {
		clock.set(Instant.parse("2026-10-22T07:00:00Z"));
	}

	@Test
	void loginNeedsPasswordAndCode() throws Exception {
		mvc.perform(post("/api/support/auth/login").contentType(MediaType.APPLICATION_JSON)
			.content("{\"email\":\"selin@tomurcuk.app\",\"password\":\"tomurcuk-demo\",\"code\":\"000000\"}"))
			.andExpect(status().isUnprocessableContent())
			.andExpect(jsonPath("$.errors.form.code").value("credentials_invalid"));
		Cookie session = login("selin@tomurcuk.app");
		mvc.perform(get("/api/support/me").cookie(session)).andExpect(jsonPath("$.role").value("agent"));
		// Dükkân oturumuyla destek uçları, destek oturumuyla (dükkân adına oturum olmadan) panel uçları kapalı.
		mvc.perform(get("/api/panel/orders").cookie(session)).andExpect(status().isForbidden());
	}

	/** Telefon maskeli gelir; gerekçesiz açılmaz, açılınca denetim kaydına yazılır. */
	@Test
	void phoneIsMaskedAndRevealNeedsReason() throws Exception {
		Cookie session = login("selin@tomurcuk.app");
		mvc.perform(get("/api/support/tickets/tk_1187").cookie(session))
			.andExpect(jsonPath("$.order.recipientPhone").value("0541 *** ** 03"))
			.andExpect(jsonPath("$.order.recipientName").value("Can Ö."));
		reveal(session, "").andExpect(status().isUnprocessableContent());
		reveal(session, "Talep: kurye adresi bulamıyor").andExpect(status().isOk())
			.andExpect(jsonPath("$.phone").value("0541 330 52 03"));
		mvc.perform(get("/api/support/audit").cookie(session))
			.andExpect(jsonPath("$[?(@.action == 'Telefon görüntülendi' && @.record == 'Sipariş T-4816, alıcı telefonu')].reason")
				.value(org.hamcrest.Matchers.hasItem("Talep: kurye adresi bulamıyor")));
	}

	/**
	 * Dükkân adına oturum: panel çalışan yetkisiyle açılır (iptal kapalı), değiştiren işlem
	 * kayda geçer; oturum 30 dakikada biter.
	 */
	@Test
	void impersonationActsAsStaffAndExpires() throws Exception {
		Cookie session = login("selin@tomurcuk.app");
		String body = mvc
			.perform(post("/api/support/shops/shop_nergis/impersonations").cookie(session)
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"reason\":\"Dükkân telefonda yardım istedi\"}"))
			.andExpect(status().isCreated())
			.andReturn()
			.getResponse()
			.getContentAsString();
		String id = JsonPath.read(body, "$.id");

		panel(get("/api/panel/session"), session, id).andExpect(jsonPath("$.impersonation.id").value(id))
			.andExpect(jsonPath("$.user.role").value("staff"));
		panel(post("/api/panel/orders/o_4822/status").content("{\"status\":\"preparing\"}"), session, id)
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.events[1].actor").value("Selin Karaca"));
		assertThat(jdbc.sql("SELECT count(*) FROM audit_log WHERE action = 'Dükkân adına işlem' AND shop_id = 'shop_nergis'")
			.query(Integer.class)
			.single()).isEqualTo(1);
		panel(post("/api/panel/orders/o_4822/status").content("{\"status\":\"cancelled\"}"), session, id)
			.andExpect(status().isForbidden());

		clock.set(clock.instant().plus(Duration.ofMinutes(31)));
		panel(get("/api/panel/orders"), session, id).andExpect(status().isForbidden());
		mvc.perform(delete("/api/support/impersonations/{id}", id).cookie(session)).andExpect(status().isNoContent());
	}

	/** Denetim kaydı yalnızca eklenir. */
	/** Deneme e-postası: adres verilmezse kullanıcının kendi adresi; hatalı adres 422. Testte sağlayıcı log. */
	@Test
	void testEmailGoesToChosenAddress() throws Exception {
		Cookie session = login("derya@tomurcuk.app");
		mvc.perform(post("/api/support/email-test").cookie(session))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.to").value("derya@tomurcuk.app"))
			.andExpect(jsonPath("$.delivered").value(false));
		mvc.perform(post("/api/support/email-test").cookie(session)
			.contentType(MediaType.APPLICATION_JSON)
			.content("{\"to\":\" ayla@nergiscicek.com \"}"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.to").value("ayla@nergiscicek.com"));
		mvc.perform(post("/api/support/email-test").cookie(session)
			.contentType(MediaType.APPLICATION_JSON)
			.content("{\"to\":\"ayla\"}"))
			.andExpect(status().isUnprocessableContent())
			.andExpect(jsonPath("$.errors.to.code").value("email_invalid"));
	}

	@Test
	void auditLogIsAppendOnly() {
		assertThatThrownBy(() -> jdbc.sql("UPDATE audit_log SET reason = 'değişti'").update())
			.hasMessageContaining("yalnızca eklenir");
		assertThatThrownBy(() -> jdbc.sql("DELETE FROM audit_log").update()).hasMessageContaining("yalnızca eklenir");
	}

	private org.springframework.test.web.servlet.ResultActions reveal(Cookie session, String reason) throws Exception {
		return mvc.perform(post("/api/support/orders/o_4816/reveal-phone").cookie(session)
			.contentType(MediaType.APPLICATION_JSON)
			.content("{\"field\":\"recipient\",\"reason\":\"" + reason + "\"}"));
	}

	private org.springframework.test.web.servlet.ResultActions panel(MockHttpServletRequestBuilder request,
			Cookie session, String impersonationId) throws Exception {
		return mvc.perform(request.cookie(session).header(IMPERSONATION, impersonationId).contentType(MediaType.APPLICATION_JSON));
	}

	private Cookie login(String email) throws Exception {
		String header = mvc
			.perform(post("/api/support/auth/login").contentType(MediaType.APPLICATION_JSON)
				.content("{\"email\":\"" + email + "\",\"password\":\"tomurcuk-demo\",\"code\":\""
						+ TotpCodes.at(TOTP_SECRET, clock.instant()) + "\"}"))
			.andExpect(status().isOk())
			.andReturn()
			.getResponse()
			.getHeader("Set-Cookie");
		return new Cookie("TOMURCUK_SESSION", header.substring("TOMURCUK_SESSION=".length(), header.indexOf(';')));
	}
}
