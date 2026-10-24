package com.tomurcuk.delivery.internal;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface DeliveryZoneRepository extends JpaRepository<DeliveryZone, String> {

	List<DeliveryZone> findByShopIdAndActiveTrueOrderByPosition(String shopId);

	List<DeliveryZone> findByShopId(String shopId);
}
