package com.tomurcuk.ordering.web;

import com.tomurcuk.ordering.Bestseller;
import com.tomurcuk.ordering.OrderDirectory;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Vitrinin sipariş verisinden gelen bilgileri: en çok gönderilen ürün. */
@RestController
@RequestMapping("/api/public/shops/{shopId}")
class PublicShopStatsController {

	private final OrderDirectory orders;

	PublicShopStatsController(OrderDirectory orders) {
		this.orders = orders;
	}

	@GetMapping("/bestseller")
	Bestseller bestseller(@PathVariable String shopId) {
		return orders.bestseller(shopId);
	}
}
