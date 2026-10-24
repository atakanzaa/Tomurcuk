package com.tomurcuk.ordering;

import static org.hamcrest.Matchers.startsWith;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;

import javax.imageio.ImageIO;

import com.jayway.jsonpath.JsonPath;
import com.tomurcuk.TestcontainersConfiguration;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

/** Panel: giriş, durum geçişleri, iptal yetkisi ve kiracı izolasyonu. */
@SpringBootTest(properties = "tomurcuk.jobs.enabled=false")
@AutoConfigureMockMvc
@ActiveProfiles("demo")
@Import(TestcontainersConfiguration.class)
class PanelTests {

	private static final String PASSWORD = "tomurcuk-demo";

	@Autowired
	MockMvc mvc;

	@Test
	void panelRequiresSession() throws Exception {
		mvc.perform(get("/api/panel/orders")).andExpect(status().isUnauthorized());
	}

	@Test
	void wrongPasswordIsRejectedWithoutSayingWhichFieldIsWrong() throws Exception {
		mvc.perform(post("/api/panel/auth/login").contentType(MediaType.APPLICATION_JSON)
			.content("{\"email\":\"ayla@nergiscicek.com\",\"password\":\"yanlis\"}"))
			.andExpect(status().isUnprocessableContent())
			.andExpect(jsonPath("$.errors.form.code").value("credentials_invalid"));
		mvc.perform(post("/api/panel/auth/login").contentType(MediaType.APPLICATION_JSON)
			.content("{\"email\":\"yok@ornek.com\",\"password\":\"yanlis\"}"))
			.andExpect(status().isUnprocessableContent())
			.andExpect(jsonPath("$.errors.form.code").value("credentials_invalid"));
	}

	/** Yeni → Hazırlanıyor → Yolda → Teslim edildi; atlanan ya da geri giden geçiş reddedilir. */
	@Test
	void orderStatusFollowsTheFlow() throws Exception {
		Cookie session = login("ayla@nergiscicek.com");
		changeStatus(session, "o_4821", "delivered").andExpect(status().isUnprocessableContent());
		changeStatus(session, "o_4821", "preparing").andExpect(status().isOk())
			.andExpect(jsonPath("$.status").value("preparing"));
		changeStatus(session, "o_4821", "onway").andExpect(status().isOk());
		changeStatus(session, "o_4821", "delivered").andExpect(status().isOk())
			.andExpect(jsonPath("$.status").value("delivered"))
			.andExpect(jsonPath("$.deliveryTime").isNotEmpty())
			.andExpect(jsonPath("$.events.length()").value(4));
		changeStatus(session, "o_4821", "cancelled").andExpect(status().isUnprocessableContent());
	}

	/** Çalışan sipariş iptal edemez (yetki matrisi). */
	@Test
	void staffCannotCancel() throws Exception {
		Cookie session = login("kemal@nergiscicek.com");
		changeStatus(session, "o_4815", "cancelled").andExpect(status().isForbidden());
		mvc.perform(get("/api/panel/orders/o_4815").cookie(session)).andExpect(jsonPath("$.status").value("preparing"));
	}

	/**
	 * Başka dükkânın siparişi ve müşterisi bulunamaz; değiştirilemez. Örnek veri test sınıfları
	 * arasında paylaşıldığı için siparişin durumu denemeden önceki haliyle karşılaştırılır.
	 */
	@Test
	void anotherShopsDataIsNotFound() throws Exception {
		Cookie owner = login("ayla@nergiscicek.com");
		String before = JsonPath.read(mvc.perform(get("/api/panel/orders/o_4822").cookie(owner))
			.andReturn()
			.getResponse()
			.getContentAsString(), "$.status");
		Cookie session = login("leyla@lalebahcesi.com");
		mvc.perform(get("/api/panel/orders/o_4822").cookie(session)).andExpect(status().isNotFound());
		mvc.perform(get("/api/panel/customers/cu_ayse").cookie(session)).andExpect(status().isNotFound());
		mvc.perform(get("/api/panel/orders").cookie(session))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.length()").value(0));
		changeStatus(session, "o_4822", "preparing").andExpect(status().isUnprocessableContent());
		mvc.perform(get("/api/panel/orders/o_4822").cookie(owner)).andExpect(jsonPath("$.status").value(before));
	}

	/** Teslim fotoğrafı yalnızca yoldaki ya da teslim edilen siparişe; başka dükkânınkine hiç. */
	@Test
	void deliveryPhotoNeedsOwnOrderOnTheWay() throws Exception {
		Cookie owner = login("ayla@nergiscicek.com");
		Cookie other = login("leyla@lalebahcesi.com");
		deliveryPhoto(other, "o_4816").andExpect(status().isNotFound());
		deliveryPhoto(owner, "o_4823").andExpect(status().isUnprocessableContent())
			.andExpect(jsonPath("$.errors.photo.code").value("delivery_photo_status"));
		deliveryPhoto(owner, "o_4816").andExpect(status().isOk())
			.andExpect(jsonPath("$.deliveryPhotoUrl").value(startsWith("/foto/")));
	}

	/** Sesli uyarının sorduğu özet yalnızca kendi dükkânının yeni siparişlerini sayar. */
	@Test
	void newOrdersSummaryIsPerShop() throws Exception {
		mvc.perform(get("/api/panel/orders/new").cookie(login("ayla@nergiscicek.com")))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.latestOrderId").isNotEmpty());
		mvc.perform(get("/api/panel/orders/new").cookie(login("leyla@lalebahcesi.com")))
			.andExpect(jsonPath("$.count").value(0))
			.andExpect(jsonPath("$.latestOrderId").isEmpty());
	}

	private ResultActions deliveryPhoto(Cookie session, String orderId) throws Exception {
		return mvc.perform(multipart("/api/panel/orders/{id}/delivery-photo", orderId)
			.file(new MockMultipartFile("file", "teslim.png", "image/png", png(640, 480)))
			.cookie(session));
	}

	private static byte[] png(int width, int height) throws IOException {
		ByteArrayOutputStream out = new ByteArrayOutputStream();
		ImageIO.write(new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB), "png", out);
		return out.toByteArray();
	}

	private ResultActions changeStatus(Cookie session, String orderId, String next) throws Exception {
		return mvc.perform(post("/api/panel/orders/{id}/status", orderId).cookie(session)
			.contentType(MediaType.APPLICATION_JSON)
			.content("{\"status\":\"" + next + "\"}"));
	}

	/** Spring Session cookie'yi doğrudan Set-Cookie başlığıyla yazar; değer oradan okunur. */
	private Cookie login(String email) throws Exception {
		String header = mvc
			.perform(post("/api/panel/auth/login").contentType(MediaType.APPLICATION_JSON)
				.content("{\"email\":\"" + email + "\",\"password\":\"" + PASSWORD + "\"}"))
			.andExpect(status().isOk())
			.andReturn()
			.getResponse()
			.getHeader("Set-Cookie");
		if (header == null || !header.startsWith("TOMURCUK_SESSION=")) {
			throw new AssertionError("Oturum cookie'si dönmedi: " + header);
		}
		return new Cookie("TOMURCUK_SESSION", header.substring("TOMURCUK_SESSION=".length(), header.indexOf(';')));
	}
}
