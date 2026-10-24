package com.tomurcuk.catalog.internal;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface ProductRepository extends JpaRepository<Product, String> {

	/** Vitrin yalnızca aktif ürünleri, dükkânın belirlediği sırayla gösterir. */
	@EntityGraph(attributePaths = "options")
	List<Product> findByShopIdAndActiveTrueOrderByPosition(String shopId);

	@EntityGraph(attributePaths = "options")
	Optional<Product> findByIdAndShopIdAndActiveTrue(String id, String shopId);

	/** Panel: satışta olmayanlar dahil, silinenler hariç. */
	@EntityGraph(attributePaths = "options")
	List<Product> findByShopIdAndDeletedAtIsNullOrderByPosition(String shopId);

	@EntityGraph(attributePaths = "options")
	Optional<Product> findByIdAndShopIdAndDeletedAtIsNull(String id, String shopId);

	@Query("SELECT coalesce(max(p.position), 0) FROM Product p WHERE p.shopId = :shopId")
	int maxPosition(String shopId);
}
