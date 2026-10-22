package com.tomurcuk.catalog;

import java.util.Optional;

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
