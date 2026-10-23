package com.tomurcuk.ordering.web;

import com.tomurcuk.ordering.internal.Checkout;
import com.tomurcuk.shop.ShopDirectory;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

/**
 * Alıcı ana sayfasındaki "Siparişinizi bulun": dükkân bilinmeden sipariş numarası ve gönderen
 * telefonuyla takip sayfasının adresi. Eşleşmezse 404; hangisinin yanlış olduğu söylenmez.
 */
@RestController
class PublicOrderLookupController {

	private final Checkout checkout;

	private final ShopDirectory shops;

	PublicOrderLookupController(Checkout checkout, ShopDirectory shops) {
		this.checkout = checkout;
		this.shops = shops;
	}

	@PostMapping("/api/public/order-lookup")
	Found find(@RequestBody Lookup body) {
		return checkout.findTrackingRef(body.number(), body.phone())
			.flatMap(ref -> shops.find(ref.shopId()).map(shop -> new Found(shop.slug(), ref.token())))
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
	}

	record Lookup(String number, String phone) {
	}

	record Found(String slug, String token) {
	}
}
