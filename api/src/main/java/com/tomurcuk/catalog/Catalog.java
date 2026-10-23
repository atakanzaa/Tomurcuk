package com.tomurcuk.catalog;

import java.util.Comparator;
import java.util.List;
import java.util.Optional;

import com.tomurcuk.catalog.internal.Product;
import com.tomurcuk.catalog.internal.ProductRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class Catalog {

	private final ProductRepository products;

	Catalog(ProductRepository products) {
		this.products = products;
	}

	/**
	 * Dükkânın satıştaki ürünlerinden ilk `limit` tanesi, dükkânın sırasıyla; `featuredId` varsa ve
	 * satıştaysa en başta.
	 */
	public List<ProductCard> cards(String shopId, String featuredId, int limit) {
		return products.findByShopIdAndActiveTrueOrderByPosition(shopId)
			.stream()
			.sorted(Comparator.comparing((Product p) -> !p.getId().equals(featuredId)))
			.limit(limit)
			.map(Catalog::card)
			.toList();
	}

	private static ProductCard card(Product product) {
		List<Long> sizes = product.getOptions()
			.stream()
			.filter(option -> option.getKind() == OptionKind.SIZE)
			.map(option -> option.getExtraPrice())
			.toList();
		long lowest = product.getPrice() + sizes.stream().mapToLong(Long::longValue).min().orElse(0);
		return new ProductCard(product.getId(), product.getName(), lowest, sizes.size() > 1, product.getPhotoUrl());
	}

	/** Pasif ürün ve başka dükkânın ürünü boş döner. */
	public Optional<ProductInfo> findActiveProduct(String shopId, String productId) {
		return products.findByIdAndShopIdAndActiveTrue(productId, shopId)
			.map(product -> new ProductInfo(product.getId(), product.getName(), product.getPrice(),
					product.getOptions()
						.stream()
						.map(option -> new ProductInfo.Option(option.getId(), option.getName(), option.getDetail(),
								option.getKind(), option.getExtraPrice()))
						.toList()));
	}
}
