package com.tomurcuk.catalog.web;

import java.io.IOException;
import java.time.Instant;
import java.util.List;
import java.util.Map;

import com.tomurcuk.catalog.internal.PanelCatalog;
import com.tomurcuk.catalog.internal.PanelCatalog.ProductInput;
import com.tomurcuk.catalog.internal.Product;
import com.tomurcuk.catalog.web.CatalogResponses.ProductResponse;
import com.tomurcuk.identity.ShopPrincipal;
import com.tomurcuk.shared.FieldError;
import com.tomurcuk.shared.ValidationException;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

/**
 * Satıcı panelinde ürünler (web/lib/api/contract.ts). Okuma dükkânın herkesine açık; yazma
 * `CATALOG_EDIT` ister, yoksa 403. Başka dükkânın ürünü 404.
 */
@RestController
@RequestMapping("/api/panel")
class PanelCatalogController {

	private final PanelCatalog catalog;

	PanelCatalogController(PanelCatalog catalog) {
		this.catalog = catalog;
	}

	/** web/lib/api/types.ts `PanelProduct`: vitrindeki ürüne ek olarak son değişiklik. */
	record PanelProductResponse(ProductResponse product, Instant updatedAt, String updatedBy) {

		static PanelProductResponse of(Product product) {
			return new PanelProductResponse(ProductResponse.of(product), product.getUpdatedAt(),
					product.getUpdatedBy());
		}
	}

	@GetMapping("/products")
	List<PanelProductResponse> products(@AuthenticationPrincipal ShopPrincipal user) {
		return catalog.list(user).stream().map(PanelProductResponse::of).toList();
	}

	@GetMapping("/products/{productId}")
	PanelProductResponse product(@AuthenticationPrincipal ShopPrincipal user, @PathVariable String productId) {
		return catalog.get(user, productId).map(PanelProductResponse::of).orElseThrow(PanelCatalogController::notFound);
	}

	@PostMapping("/products")
	@ResponseStatus(HttpStatus.CREATED)
	Map<String, String> create(@AuthenticationPrincipal ShopPrincipal user, @RequestBody ProductInput body) {
		return Map.of("productId", catalog.create(user, body).getId());
	}

	@PutMapping("/products/{productId}")
	Map<String, String> update(@AuthenticationPrincipal ShopPrincipal user, @PathVariable String productId,
			@RequestBody ProductInput body) {
		return catalog.update(user, productId, body)
			.map(product -> Map.of("productId", product.getId()))
			.orElseThrow(PanelCatalogController::notFound);
	}

	@DeleteMapping("/products/{productId}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	void delete(@AuthenticationPrincipal ShopPrincipal user, @PathVariable String productId) {
		if (!catalog.delete(user, productId)) {
			throw notFound();
		}
	}

	/** Çok parçalı form, alan adı `file`. Ürün kaydedilene kadar fotoğraf hiçbir ürüne bağlı değildir. */
	@PostMapping("/photos")
	@ResponseStatus(HttpStatus.CREATED)
	Map<String, String> uploadPhoto(@AuthenticationPrincipal ShopPrincipal user,
			@RequestParam("file") MultipartFile file) throws IOException {
		if (file.isEmpty()) {
			throw ValidationException.of("photo", FieldError.of("photo_invalid"));
		}
		return Map.of("url", catalog.uploadPhoto(user, file.getBytes()));
	}

	private static ResponseStatusException notFound() {
		return new ResponseStatusException(HttpStatus.NOT_FOUND);
	}
}
