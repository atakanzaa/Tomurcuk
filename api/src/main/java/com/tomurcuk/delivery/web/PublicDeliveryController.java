package com.tomurcuk.delivery.web;

import java.util.List;

import com.tomurcuk.delivery.internal.DeliveryZone;
import com.tomurcuk.delivery.internal.DeliveryZoneRepository;
import com.tomurcuk.delivery.internal.TimeSlot;
import com.tomurcuk.delivery.internal.TimeSlotRepository;
import com.tomurcuk.shared.ClockTimes;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/public/shops/{shopId}")
@Transactional(readOnly = true)
class PublicDeliveryController {

	private final DeliveryZoneRepository zones;

	private final TimeSlotRepository slots;

	PublicDeliveryController(DeliveryZoneRepository zones, TimeSlotRepository slots) {
		this.zones = zones;
		this.slots = slots;
	}

	/** Yalnızca aktif bölgeler; listede olmayan adres sipariş veremez. */
	@GetMapping("/delivery-zones")
	List<DeliveryZoneResponse> zones(@PathVariable String shopId) {
		return zones.findByShopIdAndActiveTrueOrderByPosition(shopId)
			.stream()
			.map(DeliveryZoneResponse::of)
			.toList();
	}

	@GetMapping("/time-slots")
	List<TimeSlotResponse> slots(@PathVariable String shopId) {
		return slots.findByShopIdOrderByStart(shopId).stream().map(TimeSlotResponse::of).toList();
	}

	/** web/lib/api/types.ts `DeliveryZone` */
	record DeliveryZoneResponse(String id, String shopId, String district, String neighborhood, long fee,
			boolean active) {

		static DeliveryZoneResponse of(DeliveryZone zone) {
			return new DeliveryZoneResponse(zone.getId(), zone.getShopId(), zone.getDistrict(),
					zone.getNeighborhood(), zone.getFee(), zone.isActive());
		}
	}

	/** web/lib/api/types.ts `TimeSlot` */
	record TimeSlotResponse(String id, String shopId, String start, String end, int capacity) {

		static TimeSlotResponse of(TimeSlot slot) {
			return new TimeSlotResponse(slot.getId(), slot.getShopId(), ClockTimes.format(slot.getStart()),
					ClockTimes.format(slot.getEnd()), slot.getCapacity());
		}
	}
}
