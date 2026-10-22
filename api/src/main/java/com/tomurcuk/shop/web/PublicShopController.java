package com.tomurcuk.shop.web;

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

	PublicShopController(ShopRepository shops, ShopSlugHistoryRepository slugHistory) {
		this.shops = shops;
		this.slugHistory = slugHistory;
	}

	/**
	 * Vitrin adresindeki slug'ı çözer. Her vitrin isteğinde çağrıldığı için hafif tutulur.
	 * Pasif dükkân da bulunur; vitrin "şu an sipariş alınmıyor" der, veri silinmez.
	 */
	@GetMapping("/shop-lookup/{slug}")
	@Transactional(readOnly = true)
	ShopLookupResponse lookup(@PathVariable String slug) {
		return shops.findBySlug(slug)
			.map(shop -> ShopLookupResponse.found(ShopResponse.of(shop)))
			.or(() -> slugHistory.findById(slug)
				.map(ShopSlugHistory::getShopId)
				.flatMap(shops::findById)
				.map(shop -> ShopLookupResponse.moved(shop.getSlug())))
			.orElseGet(ShopLookupResponse::missing);
	}
}
