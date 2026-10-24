package com.tomurcuk.catalog;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;

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

/**
 * Panelden ürün yönetimi: boylu ürünün fiyat modeli, satıştan kaldırma, fotoğraf, yetki ve
 * başka dükkânın ürünü. Örnek veri test sınıfları arasında paylaşıldığı için yalnızca yeni ürünler
 * değiştirilir.
 */
@SpringBootTest(properties = "tomurcuk.jobs.enabled=false")
@AutoConfigureMockMvc
@ActiveProfiles("demo")
@Import(TestcontainersConfiguration.class)
class PanelCatalogTests {

	private static final String PASSWORD = "tomurcuk-demo";

	@Autowired
	MockMvc mvc;

	/** Formdaki boy fiyatları tamdır; kayıtta en ucuzu ürünün fiyatı, diğerleri farkıdır. */
	@Test
	void ownerAddsProductWithSizesAndTakesItOffSale() throws Exception {
		Cookie owner = login("ayla@nergiscicek.com");
		String id = create(owner, """
				{"categoryId":"c_buket","name":"Deneme buketi","summary":"Mevsimin çiçekleri",
				 "sizes":[{"name":"Küçük, 10 dal","price":85000},{"name":"Büyük, 25 dal","price":145000}],
				 "extras":[{"name":"Cam vazo","price":18000},{"name":"Çikolata","price":24000}],
				 "photos":[],"active":true}""");
		mvc.perform(get("/api/public/shops/shop_nergis/products/{id}", id))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.price").value(85000))
			.andExpect(jsonPath("$.options[0].name").value("Küçük"))
			.andExpect(jsonPath("$.options[0].detail").value("10 dal"))
			.andExpect(jsonPath("$.options[0].extraPrice").value(0))
			.andExpect(jsonPath("$.options[1].extraPrice").value(60000))
			.andExpect(jsonPath("$.options[2].kind").value("vase"))
			.andExpect(jsonPath("$.options[3].kind").value("addon"));

		String sizeId = JsonPath.read(mvc.perform(get("/api/panel/products/{id}", id).cookie(owner))
			.andExpect(jsonPath("$.updatedBy").value("Ayla Er"))
			.andReturn().getResponse().getContentAsString(), "$.product.options[0].id");
		mvc.perform(put("/api/panel/products/{id}", id).cookie(owner).contentType(MediaType.APPLICATION_JSON)
			.content("""
					{"categoryId":"c_buket","name":"Deneme buketi","summary":"",
					 "sizes":[{"id":"%s","name":"Küçük, 10 dal","price":90000}],
					 "extras":[],"photos":[],"active":false}""".formatted(sizeId)))
			.andExpect(status().isOk());
		mvc.perform(get("/api/public/shops/shop_nergis/products/{id}", id)).andExpect(status().isNotFound());
		mvc.perform(get("/api/panel/products/{id}", id).cookie(owner))
			.andExpect(jsonPath("$.product.active").value(false))
			.andExpect(jsonPath("$.product.price").value(90000))
			.andExpect(jsonPath("$.product.options.length()").value(1))
			.andExpect(jsonPath("$.product.options[0].id").value(sizeId));

		mvc.perform(delete("/api/panel/products/{id}", id).cookie(owner)).andExpect(status().isNoContent());
		mvc.perform(get("/api/panel/products/{id}", id).cookie(owner)).andExpect(status().isNotFound());
	}

	@Test
	void invalidProductIsRejectedFieldByField() throws Exception {
		Cookie owner = login("ayla@nergiscicek.com");
		mvc.perform(post("/api/panel/products").cookie(owner).contentType(MediaType.APPLICATION_JSON)
			.content("""
					{"categoryId":"c_yok","name":" ","sizes":[],"extras":[{"name":"","price":100}],
					 "photos":["https://baska.example/foto.jpg"]}"""))
			.andExpect(status().isUnprocessableContent())
			.andExpect(jsonPath("$.errors.name.code").value("required"))
			.andExpect(jsonPath("$.errors.category.code").value("option_invalid"))
			.andExpect(jsonPath("$.errors.price.code").value("required"))
			.andExpect(jsonPath("$.errors.extras.code").value("option_invalid"))
			.andExpect(jsonPath("$.errors.photos.code").value("photo_invalid"));
	}

	/** Fotoğraf ortadan 4:5 kırpılır ve JPEG olarak yazılır; yalnızca yüklenen adres kabul edilir. */
	@Test
	void photoIsCroppedToFourByFive() throws Exception {
		Cookie owner = login("ayla@nergiscicek.com");
		String url = JsonPath.read(mvc.perform(multipart("/api/panel/photos")
			.file(new MockMultipartFile("file", "buket.png", "image/png", png(1000, 1000)))
			.cookie(owner))
			.andExpect(status().isCreated())
			.andReturn().getResponse().getContentAsString(), "$.url");
		assertThat(url).startsWith("/foto/").endsWith(".jpg");

		byte[] jpeg = mvc.perform(get("/api/public/photos/{name}", url.substring("/foto/".length())))
			.andExpect(status().isOk())
			.andReturn().getResponse().getContentAsByteArray();
		BufferedImage stored = ImageIO.read(new ByteArrayInputStream(jpeg));
		assertThat(stored.getWidth()).isEqualTo(800);
		assertThat(stored.getHeight()).isEqualTo(1000);

		String id = create(owner, """
				{"categoryId":"c_buket","name":"Fotoğraflı buket","price":50000,"photos":["%s"]}""".formatted(url));
		mvc.perform(get("/api/public/shops/shop_nergis/products/{id}", id))
			.andExpect(jsonPath("$.photoUrl").value(url))
			.andExpect(jsonPath("$.photos[0]").value(url));
		mvc.perform(delete("/api/panel/products/{id}", id).cookie(owner)).andExpect(status().isNoContent());

		mvc.perform(multipart("/api/panel/photos")
			.file(new MockMultipartFile("file", "not.png", "image/png", "görüntü değil".getBytes()))
			.cookie(owner))
			.andExpect(status().isUnprocessableContent())
			.andExpect(jsonPath("$.errors.photo.code").value("photo_invalid"));
	}

	/** Çalışan ürünleri görür ama değiştiremez (yetki matrisi). */
	@Test
	void staffCanReadButNotEdit() throws Exception {
		Cookie staff = login("kemal@nergiscicek.com");
		mvc.perform(get("/api/panel/products").cookie(staff)).andExpect(status().isOk());
		mvc.perform(post("/api/panel/products").cookie(staff).contentType(MediaType.APPLICATION_JSON)
			.content("{\"categoryId\":\"c_buket\",\"name\":\"Yetkisiz\",\"price\":1000}"))
			.andExpect(status().isForbidden());
		mvc.perform(delete("/api/panel/products/p_kir").cookie(staff)).andExpect(status().isForbidden());
	}

	@Test
	void anotherShopsProductIsNotFound() throws Exception {
		Cookie other = login("leyla@lalebahcesi.com");
		mvc.perform(get("/api/panel/products/p_lale").cookie(other)).andExpect(status().isNotFound());
		mvc.perform(put("/api/panel/products/p_lale").cookie(other).contentType(MediaType.APPLICATION_JSON)
			.content("{\"categoryId\":\"c_buket\",\"name\":\"Ele geçirildi\",\"price\":100}"))
			.andExpect(status().isNotFound());
		mvc.perform(delete("/api/panel/products/p_lale").cookie(other)).andExpect(status().isNotFound());
		mvc.perform(get("/api/public/shops/shop_nergis/products/p_lale"))
			.andExpect(jsonPath("$.name").value("Bu haftanın lalesi"));
	}

	private String create(Cookie session, String json) throws Exception {
		return JsonPath.read(mvc.perform(post("/api/panel/products").cookie(session)
			.contentType(MediaType.APPLICATION_JSON)
			.content(json))
			.andExpect(status().isCreated())
			.andReturn().getResponse().getContentAsString(), "$.productId");
	}

	private static byte[] png(int width, int height) throws Exception {
		BufferedImage image = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);
		Graphics2D g = image.createGraphics();
		g.setColor(new Color(0xB0365E));
		g.fillRect(0, 0, width, height);
		g.dispose();
		ByteArrayOutputStream out = new ByteArrayOutputStream();
		ImageIO.write(image, "png", out);
		return out.toByteArray();
	}

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
