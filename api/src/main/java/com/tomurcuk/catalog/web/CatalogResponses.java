package com.tomurcuk.catalog.web;

import java.util.List;

import com.tomurcuk.catalog.OptionKind;
import com.tomurcuk.catalog.internal.Category;
import com.tomurcuk.catalog.internal.Product;
import com.tomurcuk.catalog.internal.ProductOption;

/** web/lib/api/types.ts `Category`, `Product`, `ProductOption`. */
final class CatalogResponses {

	private CatalogResponses() {
	}

	record CategoryResponse(String id, String shopId, String slug, String name, int order) {

		static CategoryResponse of(Category category) {
			return new CategoryResponse(category.getId(), category.getShopId(), category.getSlug(), category.getName(),
					category.getPosition());
		}
	}

	record ProductOptionResponse(String id, String productId, String name, String detail, OptionKind kind,
			long extraPrice) {

		static ProductOptionResponse of(String productId, ProductOption option) {
			return new ProductOptionResponse(option.getId(), productId, option.getName(), option.getDetail(),
					option.getKind(), option.getExtraPrice());
		}
	}

	record ProductResponse(String id, String shopId, String categoryId, String name, String description,
			String summary, long price, String photoUrl, boolean active, int order,
			List<ProductOptionResponse> options) {

		static ProductResponse of(Product product) {
			return new ProductResponse(product.getId(), product.getShopId(), product.getCategoryId(),
					product.getName(), product.getDescription(), product.getSummary(), product.getPrice(),
					product.getPhotoUrl(), product.isActive(), product.getPosition(),
					product.getOptions()
						.stream()
						.map(option -> ProductOptionResponse.of(product.getId(), option))
						.toList());
		}
	}
}
