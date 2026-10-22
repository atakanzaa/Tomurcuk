package com.tomurcuk.catalog.internal;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductRepository extends JpaRepository<Product, String> {

	/** Vitrin yalnızca aktif ürünleri, dükkânın belirlediği sırayla gösterir. */
	@EntityGraph(attributePaths = "options")
	List<Product> findByShopIdAndActiveTrueOrderByPosition(String shopId);

	@EntityGraph(attributePaths = "options")
	Optional<Product> findByIdAndShopIdAndActiveTrue(String id, String shopId);
}
