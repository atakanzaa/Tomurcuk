package com.tomurcuk.shop;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Map;

import org.junit.jupiter.api.Test;

/**
 * Kapaktan türetilen tema her tonda okunur kalır: buton yazısı ve buton/zemin 4.5:1, metin ve
 * ikincil metin zemin ve kraft üstünde 4.5:1, form kenarlığı 3:1. Açık ve koyu tema için.
 */
class ShopThemeTests {

	@Test
	void everyHueStaysReadable() {
		for (int h = 0; h < 360; h += 5) {
			for (double s : new double[] { 0.25, 0.5, 0.75 }) {
				ShopTheme theme = ShopTheme.from(ShopTheme.hex(h, s, 0.5));
				String where = "ton " + h + ", doygunluk " + s;
				check(theme.light(), where + ", açık");
				check(theme.dark(), where + ", koyu");
			}
		}
	}

	@Test
	void invalidColorGivesNoTheme() {
		assertThat(ShopTheme.from(null)).isNull();
		assertThat(ShopTheme.from("pembe")).isNull();
		assertThat(ShopTheme.from("#C2456E").source()).isEqualTo("#c2456e");
	}

	private static void check(Map<String, String> t, String where) {
		assertThat(ShopTheme.contrast(t.get("stem"), t.get("on-stem"))).as(where + ": buton yazısı").isGreaterThanOrEqualTo(4.5);
		assertThat(ShopTheme.contrast(t.get("stem"), t.get("paper"))).as(where + ": buton/zemin").isGreaterThanOrEqualTo(4.5);
		for (String surface : new String[] { "paper", "paper-raised", "kraft" }) {
			assertThat(ShopTheme.contrast(t.get("ink"), t.get(surface))).as(where + ": metin/" + surface)
				.isGreaterThanOrEqualTo(4.5);
			assertThat(ShopTheme.contrast(t.get("ink-muted"), t.get(surface))).as(where + ": ikincil/" + surface)
				.isGreaterThanOrEqualTo(4.5);
		}
		assertThat(ShopTheme.contrast(t.get("line-strong"), t.get("paper"))).as(where + ": kenarlık")
			.isGreaterThanOrEqualTo(3);
	}
}
