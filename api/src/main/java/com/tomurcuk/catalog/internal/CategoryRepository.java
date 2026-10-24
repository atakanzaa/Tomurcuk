package com.tomurcuk.catalog.internal;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface CategoryRepository extends JpaRepository<Category, String> {

	List<Category> findByShopIdOrderByPosition(String shopId);

	Optional<Category> findByIdAndShopId(String id, String shopId);

	Optional<Category> findByShopIdAndNameIgnoreCase(String shopId, String name);

	boolean existsByShopIdAndSlug(String shopId, String slug);
}
