package com.tomurcuk.catalog.internal;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface CategoryRepository extends JpaRepository<Category, String> {

	List<Category> findByShopIdOrderByPosition(String shopId);
}
