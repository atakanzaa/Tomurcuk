package com.tomurcuk.shop.web;

import java.time.Clock;
import java.time.Instant;

import com.tomurcuk.shop.ShopStatus;
import com.tomurcuk.shop.ShopView;
import com.tomurcuk.shop.internal.ShopRepository;
import com.tomurcuk.shop.internal.ShopSlugHistory;
import com.tomurcuk.shop.internal.ShopSlugHistoryRepository;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/public")
class PublicShopController {

	private final ShopRepository shops;

	private final ShopSlugHistoryRepository slugHistory;

	private final Clock clock;

	PublicShopController(ShopRepository shops, ShopSlugHistoryRepository slugHistory, Clock clock) {
		this.shops = shops;
		this.slugHistory = slugHistory;
		this.clock = clock;
	}

	/**
	 * Vitrin adresindeki slug'ı çözer. Her vitrin isteğinde çağrıldığı için hafif tutulur.
	 * Geçici kapalı ve askıdaki dükkân bulunur, vitrin durumu söyler; kalıcı kapalı dükkân
	 * bulunamaz (404). Eski adresi de yönlendirilmez.
	 */
	@GetMapping("/shop-lookup/{slug}")
	@Transactional(readOnly = true)
	ShopLookupResponse lookup(@PathVariable String slug) {
		Instant now = clock.instant();
		return shops.findBySlug(slug)
			.filter(shop -> shop.effectiveStatus(now) != ShopStatus.CLOSED)
			.map(shop -> ShopLookupResponse.found(ShopView.of(shop, now)))
			.or(() -> slugHistory.findById(slug)
				.map(ShopSlugHistory::getShopId)
				.flatMap(shops::findById)
				.filter(shop -> shop.effectiveStatus(now) != ShopStatus.CLOSED)
				.map(shop -> ShopLookupResponse.moved(shop.getSlug())))
			.orElseGet(ShopLookupResponse::missing);
	}
}
