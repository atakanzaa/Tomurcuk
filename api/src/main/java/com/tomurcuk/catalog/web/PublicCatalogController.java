package com.tomurcuk.catalog.web;

import java.util.List;

import com.tomurcuk.catalog.internal.CategoryRepository;
import com.tomurcuk.catalog.internal.ProductRepository;
import com.tomurcuk.catalog.web.CatalogResponses.CategoryResponse;
import com.tomurcuk.catalog.web.CatalogResponses.ProductResponse;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/public/shops/{shopId}")
@Transactional(readOnly = true)
class PublicCatalogController {

	private final CategoryRepository categories;

	private final ProductRepository products;

	PublicCatalogController(CategoryRepository categories, ProductRepository products) {
		this.categories = categories;
		this.products = products;
	}

	@GetMapping("/categories")
	List<CategoryResponse> categories(@PathVariable String shopId) {
		return categories.findByShopIdOrderByPosition(shopId).stream().map(CategoryResponse::of).toList();
	}

	@GetMapping("/products")
	List<ProductResponse> products(@PathVariable String shopId) {
		return products.findByShopIdAndActiveTrueOrderByPosition(shopId).stream().map(ProductResponse::of).toList();
	}

	/** Pasif ürün ve başka dükkânın ürünü de 404 döner. */
	@GetMapping("/products/{productId}")
	ProductResponse product(@PathVariable String shopId, @PathVariable String productId) {
		return products.findByIdAndShopIdAndActiveTrue(productId, shopId)
			.map(ProductResponse::of)
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
	}
}
