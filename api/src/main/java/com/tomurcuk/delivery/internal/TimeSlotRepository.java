package com.tomurcuk.delivery.internal;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface TimeSlotRepository extends JpaRepository<TimeSlot, String> {

	/** Vitrin ve takvim yalnızca aktif aralıkları kullanır. */
	List<TimeSlot> findByShopIdAndActiveTrueOrderByStart(String shopId);
}
