package com.tomurcuk.shop.internal;

import java.util.Optional;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ShopRepository extends JpaRepository<Shop, String> {

	@EntityGraph(attributePaths = "previousSlugs")
	Optional<Shop> findBySlug(String slug);

	boolean existsBySlug(String slug);
}
