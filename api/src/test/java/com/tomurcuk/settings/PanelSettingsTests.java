package com.tomurcuk.settings;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

import javax.imageio.ImageIO;

import com.tomurcuk.MutableClock;
import com.tomurcuk.TestcontainersConfiguration;
import com.tomurcuk.delivery.DeliveryDay;
import com.tomurcuk.delivery.DeliverySchedule;
import com.tomurcuk.delivery.DeliverySettings;
import com.tomurcuk.delivery.DeliverySettings.SlotRow;
import com.tomurcuk.delivery.DeliverySettings.ZoneRow;
import com.tomurcuk.media.PhotoKind;
import com.tomurcuk.media.Photos;
import com.tomurcuk.ordering.OrderDirectory;
import com.tomurcuk.shared.Ids;
import com.tomurcuk.shared.ValidationException;
import com.tomurcuk.shop.ShopDirectory;
import com.tomurcuk.shop.ShopInfo;
import com.tomurcuk.shop.ShopSettings;
import com.tomurcuk.shop.ShopSettings.PageInput;
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

/**
 * Dükkân ve teslimat ayarları: yetki, listeden bölge, kapasite değişince dolu yer, kaldırılan
 * aralık ve kapalı gün. Örnek veri test sınıfları arasında paylaşıldığı için yazan testler her
 * çalışmada yeni açılan bir dükkânda çalışır.
 */
@SpringBootTest(properties = "tomurcuk.jobs.enabled=false")
@AutoConfigureMockMvc
@ActiveProfiles("demo")
@Import(TestcontainersConfiguration.class)
class PanelSettingsTests {

	private static final LocalDate TOMORROW = LocalDate.parse("2026-10-23");

	@Autowired
	MockMvc mvc;

	@Autowired
	DeliverySettings settings;

	@Autowired
	DeliverySchedule schedule;

	@Autowired
	ShopDirectory shops;

	@Autowired
	MutableClock clock;

	@Autowired
	JdbcClient jdbc;

	@Autowired
	ShopSettings shopSettings;

	@Autowired
	Photos photos;

	@Autowired
	OrderDirectory orders;

	String shopId;

	@BeforeEach
	void newShop() {
		clock.set(Instant.parse("2026-10-22T07:00:00Z"));
		shopId = "t_" + Ids.token(10);
		jdbc.sql("""
				INSERT INTO shop (id, slug, name, short_name, phone, address, plan, same_day_cutoff)
				VALUES (:id, :id, 'Deneme Çiçek', 'Deneme', '0216 000 00 00', 'Caferağa Mah., Kadıköy', 'pilot', '15:00')
				""").param("id", shopId).update();
		settings.replaceSlots(shopId, List.of(new SlotRow(null, "10:00", "13:00", 4)));
	}

	@Test
	void staffSeesButCannotChangeSettings() throws Exception {
		Cookie staff = login("kemal@nergiscicek.com");
		mvc.perform(get("/api/panel/settings").cookie(staff))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.profile.shop.name").value("Nergis Çiçek Atölyesi"));
		mvc.perform(put("/api/panel/settings/slots").cookie(staff).contentType(MediaType.APPLICATION_JSON)
			.content("[{\"start\":\"09:00\",\"end\":\"12:00\",\"capacity\":1}]"))
			.andExpect(status().isForbidden());
		mvc.perform(post("/api/panel/settings/closed-days").cookie(staff).contentType(MediaType.APPLICATION_JSON)
			.content("{\"date\":\"2026-12-31\"}"))
			.andExpect(status().isForbidden());
	}

	/** Bölge İstanbul listesinden; kayıtlı eski bölge (listede olmayan "Moda") değişmedikçe kalır. */
	@Test
	void zonesComeFromTheList() throws Exception {
		Cookie owner = login("ayla@nergiscicek.com");
		mvc.perform(put("/api/panel/settings/zones").cookie(owner).contentType(MediaType.APPLICATION_JSON)
			.content("[{\"district\":\"Kadıköy\",\"neighborhood\":\"Moda Sahili\",\"fee\":5000}]"))
			.andExpect(status().isUnprocessableContent())
			.andExpect(jsonPath("$.errors.zones.code").value("zone_invalid"));

		jdbc.sql("""
				INSERT INTO delivery_zone (id, shop_id, district, neighborhood, fee, active, position)
				VALUES (:id, :shopId, 'Kadıköy', 'Moda', 9000, TRUE, 1)
				""").param("id", shopId + "_moda").param("shopId", shopId).update();
		settings.replaceZones(shopId, List.of(new ZoneRow(shopId + "_moda", "Kadıköy", "Moda", 9000L),
				new ZoneRow(null, "Kadıköy", "Caferağa", 12000L)));
		assertThat(settings.zones(shopId)).extracting(ZoneRow::neighborhood).containsExactly("Moda", "Caferağa");
		assertThatThrownBy(() -> settings.replaceZones(shopId, List.of(new ZoneRow(null, "Kadıköy", "Moda", 1L))))
			.isInstanceOf(ValidationException.class);
		assertThatThrownBy(() -> settings.replaceZones(shopId,
				List.of(new ZoneRow(null, "Üsküdar", null, 1L), new ZoneRow(null, "Üsküdar", null, 2L))))
			.isInstanceOf(ValidationException.class);
	}

	/** Kapasite düşünce o günün dolu yeri korunur; diğer günler yeni kapasiteyle açılır. */
	@Test
	void lowerCapacityKeepsTakenPlaces() {
		String slotId = settings.slots(shopId).getFirst().id();
		for (int i = 0; i < 3; i++) {
			assertThat(schedule.takeForOrder(shopId, TOMORROW, slotId)).isTrue();
		}
		settings.replaceSlots(shopId, List.of(new SlotRow(slotId, "10:00", "13:00", 2)));

		List<DeliveryDay> days = schedule.days(shop(), 3);
		assertThat(remaining(days.get(1))).isZero();
		assertThat(remaining(days.get(2))).isEqualTo(2);
		assertThat(schedule.takeForOrder(shopId, TOMORROW, slotId)).isFalse();
	}

	/** Kaldırılan aralık takvimden çıkar ama kaydı durur; aynı saatte yenisi açılabilir. */
	@Test
	void removedSlotLeavesTheCalendar() {
		String oldId = settings.slots(shopId).getFirst().id();
		settings.replaceSlots(shopId, List.of(new SlotRow(null, "10:00", "12:00", 3), new SlotRow(null, "14:00", "17:00", 3)));
		assertThat(schedule.days(shop(), 2).get(1).slots()).extracting(DeliveryDay.SlotRemaining::slotId)
			.doesNotContain(oldId)
			.hasSize(2);
		assertThat(jdbc.sql("SELECT active FROM time_slot WHERE id = :id").param("id", oldId).query(Boolean.class).single())
			.isFalse();
		assertThatThrownBy(() -> settings.replaceSlots(shopId,
				List.of(new SlotRow(null, "10:00", "13:00", 3), new SlotRow(null, "12:00", "15:00", 3))))
			.isInstanceOf(ValidationException.class);
	}

	@Test
	void closedDayBlocksOrders() {
		String slotId = settings.slots(shopId).getFirst().id();
		schedule.takeForOrder(shopId, TOMORROW, slotId);
		assertThat(settings.addClosedDay(shopId, TOMORROW.toString()).reserved()).isEqualTo(1);
		assertThat(schedule.check(shop(), TOMORROW.toString(), slotId, null)).containsKey("date");
		assertThat(settings.removeClosedDay(shopId, TOMORROW)).isTrue();
		assertThat(schedule.check(shop(), TOMORROW.toString(), slotId, null)).isEmpty();
	}

	private ShopInfo shop() {
		return shops.find(shopId).orElseThrow();
	}

	private static int remaining(DeliveryDay day) {
		return day.slots().getFirst().remaining();
	}

	/**
	 * Dükkânın sayfası: hikâye ve kuruluş yılı kaydolur; fotoğraf yalnızca Tomurcuk'un deposundan
	 * olur, kapak 3:2 kırpılır; gelecek yıl ve dördüncü atölye fotoğrafı reddedilir.
	 */
	@Test
	void pageKeepsOnlyOwnPhotos() throws Exception {
		String cover = photos.store(PhotoKind.COVER, png(1200, 1200));
		String square = photos.store(PhotoKind.SQUARE, png(800, 600));
		shopSettings.updatePage(shopId, new PageInput(square, cover, "  2009'dan beri Moda'da.  ", 2009,
				List.of(square), null, "Lalelerimiz pazartesi gelir."), photos::owns);
		assertThat(shops.view(shopId)).hasValueSatisfying(view -> {
			assertThat(view.coverPhotoUrl()).isEqualTo(cover);
			assertThat(view.story()).isEqualTo("2009'dan beri Moda'da.");
			assertThat(view.foundedYear()).isEqualTo(2009);
			assertThat(view.storyPhotos()).containsExactly(square);
		});

		assertThatThrownBy(() -> shopSettings.updatePage(shopId, new PageInput(null,
				"https://baska.site/kapak.jpg", "", 2030, List.of(square, square, square, square), null, ""),
				photos::owns))
			.isInstanceOfSatisfying(ValidationException.class, ex -> {
				assertThat(ex.getErrors().get("coverPhotoUrl").code()).isEqualTo("photo_invalid");
				assertThat(ex.getErrors().get("foundedYear").code()).isEqualTo("option_invalid");
				assertThat(ex.getErrors().get("storyPhotos").code()).isEqualTo("too_many");
			});
		assertThat(orders.bestseller(shopId).productId()).isNull();
		assertThat(orders.bestseller("shop_nergis").orders()).satisfiesAnyOf(n -> assertThat(n).isZero(),
				n -> assertThat(n).isGreaterThanOrEqualTo(3));
	}

	private static byte[] png(int width, int height) throws IOException {
		ByteArrayOutputStream out = new ByteArrayOutputStream();
		ImageIO.write(new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB), "png", out);
		return out.toByteArray();
	}

	private Cookie login(String email) throws Exception {
		String header = mvc
			.perform(post("/api/panel/auth/login").contentType(MediaType.APPLICATION_JSON)
				.content("{\"email\":\"" + email + "\",\"password\":\"tomurcuk-demo\"}"))
			.andExpect(status().isOk())
			.andReturn()
			.getResponse()
			.getHeader("Set-Cookie");
		return new Cookie("TOMURCUK_SESSION", header.substring("TOMURCUK_SESSION=".length(), header.indexOf(';')));
	}
}
