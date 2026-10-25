package com.tomurcuk.review;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Instant;

import com.tomurcuk.MutableClock;
import com.tomurcuk.TestcontainersConfiguration;
import com.tomurcuk.identity.PlatformPrincipal;
import com.tomurcuk.identity.PlatformRole;
import com.tomurcuk.shared.ValidationException;
import com.tomurcuk.support.internal.ReviewModeration;
import com.tomurcuk.support.internal.ReviewModeration.HideInput;
import org.junit.jupiter.api.AfterEach;
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

/** Ürün yorumları: kim, ne zaman yazar; nerede görünür; destek gizleyince ne olur. */
@SpringBootTest(properties = "tomurcuk.jobs.enabled=false")
@AutoConfigureMockMvc
@ActiveProfiles("demo")
@Import(TestcontainersConfiguration.class)
class ReviewTests {

	private static final String SHOP = "shop_nergis";

	/** T-4817, teslim edildi, yorumsuz; gönderen "Deniz", ürün Kır buketi. */
	private static final String DELIVERED = "d4Wn8HcZp1QaE6uJ";

	private static final PlatformPrincipal AGENT = new PlatformPrincipal("pu_selin", "Selin Karaca",
			"selin@tomurcuk.app", PlatformRole.AGENT);

	@Autowired
	Reviews reviews;

	@Autowired
	ReviewModeration moderation;

	@Autowired
	MutableClock clock;

	@Autowired
	MockMvc mvc;

	@Autowired
	JdbcClient jdbc;

	@BeforeEach
	void setUp() {
		clock.set(Instant.parse("2026-10-22T12:00:00Z"));
	}

	/** Örnek veri paylaşılır: yazılan yorum silinir, gizlenen örnek yorum geri açılır. */
	@AfterEach
	void restore() {
		jdbc.sql("DELETE FROM review WHERE order_id = 'o_4817'").update();
		jdbc.sql("UPDATE review SET hidden_at = NULL, hidden_reason = NULL, hidden_by = NULL").update();
	}

	@Test
	void onlyDeliveredOrdersAreReviewedOnce() {
		// Örnek siparişlerin durumu başka test sınıflarında ilerleyebilir; henüz yeni olan biri seçilir.
		String newOrder = jdbc.sql("SELECT tracking_token FROM orders WHERE shop_id = :shopId AND status = 'new' LIMIT 1")
			.param("shopId", SHOP)
			.query(String.class)
			.single();
		assertThat(reviews.state(SHOP, newOrder)).hasValueSatisfying(s -> {
			assertThat(s.canWrite()).isFalse();
			assertThat(s.reason()).isEqualTo("not_delivered");
		});
		assertThatThrownBy(() -> reviews.write(SHOP, newOrder, new ReviewInput(5, "Güzel", false)))
			.isInstanceOfSatisfying(ValidationException.class,
					ex -> assertThat(ex.getErrors().get("order").code()).isEqualTo("not_delivered"));

		assertThat(reviews.state(SHOP, DELIVERED)).hasValueSatisfying(s -> {
			assertThat(s.canWrite()).isTrue();
			assertThat(s.authorName()).isEqualTo("Deniz");
		});
		assertThatThrownBy(() -> reviews.write(SHOP, DELIVERED, new ReviewInput(6, "x".repeat(501), false)))
			.isInstanceOfSatisfying(ValidationException.class, ex -> {
				assertThat(ex.getErrors().get("rating").code()).isEqualTo("option_invalid");
				assertThat(ex.getErrors().get("text").code()).isEqualTo("too_long");
			});

		int before = reviews.forProduct(SHOP, "p_kir", 30).rating().count();
		Review review = reviews.write(SHOP, DELIVERED, new ReviewInput(4, "  Kır buketi çok tazeydi.  ", true))
			.orElseThrow();
		assertThat(review.authorName()).isEqualTo("Bir alıcı");
		assertThat(review.text()).isEqualTo("Kır buketi çok tazeydi.");
		assertThat(review.products()).extracting(Review.Product::productId).containsExactly("p_kir");

		ProductReviews product = reviews.forProduct(SHOP, "p_kir", 30);
		assertThat(product.rating().count()).isEqualTo(before + 1);
		assertThat(product.reviews()).extracting(Review::id).contains(review.id());
		assertThat(reviews.ratings(SHOP).products()).containsKey("p_kir");

		assertThat(reviews.state(SHOP, DELIVERED)).hasValueSatisfying(s -> {
			assertThat(s.canWrite()).isFalse();
			assertThat(s.reason()).isEqualTo("already_reviewed");
			assertThat(s.review().id()).isEqualTo(review.id());
		});
		assertThatThrownBy(() -> reviews.write(SHOP, DELIVERED, new ReviewInput(5, "", false)))
			.isInstanceOfSatisfying(ValidationException.class,
					ex -> assertThat(ex.getErrors().get("order").code()).isEqualTo("already_reviewed"));
	}

	@Test
	void writingClosesThirtyDaysAfterDelivery() {
		clock.set(Instant.parse("2026-11-22T12:00:00Z"));
		assertThat(reviews.state(SHOP, DELIVERED)).hasValueSatisfying(s -> {
			assertThat(s.canWrite()).isFalse();
			assertThat(s.reason()).isEqualTo("review_closed");
		});
	}

	@Test
	void trackingCodeOfAnotherShopDoesNotWork() throws Exception {
		assertThat(reviews.state("shop_lale", DELIVERED)).isEmpty();
		mvc.perform(post("/api/public/shops/shop_lale/tracking/" + DELIVERED + "/review")
			.contentType(MediaType.APPLICATION_JSON)
			.content("{\"rating\":5,\"text\":\"\",\"hideName\":false}")).andExpect(status().isNotFound());
		assertThat(jdbc.sql("SELECT count(*) FROM review WHERE order_id = 'o_4817'").query(Integer.class).single())
			.isZero();
	}

	@Test
	void hiddenReviewDropsFromEveryList() {
		Review mevsim = reviews.forProduct(SHOP, "p_mevsim", 30).reviews().getFirst();
		int count = reviews.forProduct(SHOP, "p_mevsim", 30).rating().count();

		assertThatThrownBy(() -> moderation.hide(AGENT, mevsim.id(), new HideInput(" ")))
			.isInstanceOf(ValidationException.class);
		Review hidden = moderation.hide(AGENT, mevsim.id(), new HideInput("Kişisel bilgi içeriyor")).orElseThrow();
		assertThat(hidden.hidden()).isTrue();
		assertThat(moderation.hide(AGENT, mevsim.id(), new HideInput("İkinci kez"))).isEmpty();

		assertThat(reviews.forProduct(SHOP, "p_mevsim", 30).reviews()).extracting(Review::id).doesNotContain(mevsim.id());
		assertThat(reviews.forProduct(SHOP, "p_mevsim", 30).rating().count()).isEqualTo(count - 1);
		assertThat(reviews.recent(6)).extracting(RecentReview::id).doesNotContain(mevsim.id());
		// Dükkân gizlenen yorumu panelde görür.
		assertThat(reviews.forShop(SHOP, 200)).filteredOn(r -> r.id().equals(mevsim.id()))
			.singleElement()
			.satisfies(r -> assertThat(r.hiddenReason()).isEqualTo("Kişisel bilgi içeriyor"));
		assertThat(jdbc.sql("SELECT count(*) FROM audit_log WHERE action = 'Yorum gizlendi' AND actor_id = 'pu_selin'")
			.query(Integer.class)
			.single()).isPositive();
	}

	@Test
	void homepageReviewsNameTheShopAndMixShops() {
		var recent = reviews.recent(6);
		assertThat(recent).hasSize(6).allSatisfy(r -> {
			assertThat(r.shopName()).isNotBlank();
			assertThat(r.shopSlug()).isNotBlank();
			assertThat(r.text()).isNotBlank();
		});
		assertThat(recent.subList(0, 3)).extracting(RecentReview::shopSlug).doesNotHaveDuplicates();
		assertThat(recent).extracting(RecentReview::shopName).contains("Lale Bahçesi", "Begonvil Atölye");
	}
}
