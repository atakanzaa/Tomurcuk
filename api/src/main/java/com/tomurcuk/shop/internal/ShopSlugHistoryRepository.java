package com.tomurcuk.shop.internal;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ShopSlugHistoryRepository extends JpaRepository<ShopSlugHistory, String> {
}
