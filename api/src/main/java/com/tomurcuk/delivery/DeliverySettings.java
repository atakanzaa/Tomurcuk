package com.tomurcuk.delivery;

import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

import com.tomurcuk.delivery.internal.DeliveryZone;
import com.tomurcuk.delivery.internal.DeliveryZoneRepository;
import com.tomurcuk.delivery.internal.TimeSlot;
import com.tomurcuk.delivery.internal.TimeSlotRepository;
import com.tomurcuk.shared.ClockTimes;
import com.tomurcuk.shared.FieldError;
import com.tomurcuk.shared.Ids;
import com.tomurcuk.shared.ValidationException;
import com.tomurcuk.shop.ShopDirectory;
import com.tomurcuk.shop.ShopInfo;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Dükkânın teslimat ayarları: saat aralıkları, teslim bölgeleri ve kapalı günler. Yetki
 * denetimini çağıran yapar (settings modülü). Kaldırılan aralık ve bölge silinmez, pasife alınır;
 * siparişler ve günlük doluluk onlara bağlıdır.
 */
@Service
@Transactional(readOnly = true)
public class DeliverySettings {

	/** 100.000 TL, kuruş. */
	static final long MAX_FEE = 10_000_000L;

	static final int MAX_SLOTS = 12;

	static final int MAX_ZONES = 100;

	static final int MAX_CAPACITY = 200;

	/** Kapalı gün en çok bir yıl sonrası için girilir. */
	static final int CLOSED_DAY_WINDOW = 366;

	private final TimeSlotRepository slots;

	private final DeliveryZoneRepository zones;

	private final JdbcClient jdbc;

	private final ShopDirectory shops;

	private final Places places;

	private final Clock clock;

	DeliverySettings(TimeSlotRepository slots, DeliveryZoneRepository zones, JdbcClient jdbc, ShopDirectory shops,
			Places places, Clock clock) {
		this.slots = slots;
		this.zones = zones;
		this.jdbc = jdbc;
		this.shops = shops;
		this.places = places;
		this.clock = clock;
	}

	/** Saat aralığı; `id` yeni satırda boş. Saatler "HH:mm". */
	public record SlotRow(String id, String start, String end, Integer capacity) {
	}

	/** Teslim bölgesi; mahalle boşsa bütün ilçe. Ücret kuruş. */
	public record ZoneRow(String id, String district, String neighborhood, Long fee) {
	}

	/** `reserved`: o güne ayrılmış yer (sipariş ve ödeme bekleyen taslak) sayısı. */
	public record ClosedDay(LocalDate date, int reserved) {
	}

	public List<SlotRow> slots(String shopId) {
		return slots.findByShopIdAndActiveTrueOrderByStart(shopId)
			.stream()
			.map(s -> new SlotRow(s.getId(), ClockTimes.format(s.getStart()), ClockTimes.format(s.getEnd()),
					s.getCapacity()))
			.toList();
	}

	public List<ZoneRow> zones(String shopId) {
		return zones.findByShopIdAndActiveTrueOrderByPosition(shopId)
			.stream()
			.map(z -> new ZoneRow(z.getId(), z.getDistrict(), z.getNeighborhood(), z.getFee()))
			.toList();
	}

	/** Bugünden sonraki kapalı günler. */
	public List<ClosedDay> closedDays(String shopId) {
		return jdbc.sql("""
				SELECT c.date, coalesce(sum(sc.taken), 0) AS reserved
				FROM closed_day c
				LEFT JOIN slot_capacity sc ON sc.shop_id = c.shop_id AND sc.date = c.date
				WHERE c.shop_id = :shopId AND c.date >= :today
				GROUP BY c.date ORDER BY c.date
				""")
			.param("shopId", shopId)
			.param("today", today(shopId))
			.query((rs, n) -> new ClosedDay(rs.getObject("date", LocalDate.class), rs.getInt("reserved")))
			.list();
	}

	/**
	 * Listeyi olduğu gibi yazar: kimliği gelen aralık güncellenir, gelmeyen pasife alınır. Kapasite
	 * değişince bugünden sonraki günlerin sayacı da değişir; dolu yer korunur.
	 * Hatalar `slots` alanında: `required`, `option_invalid`, `too_many`, `slot_overlap`.
	 */
	@Transactional
	public void replaceSlots(String shopId, List<SlotRow> input) {
		List<SlotRow> rows = input == null ? List.of() : input;
		record Parsed(SlotRow row, LocalTime start, LocalTime end, int capacity) {
		}
		List<Parsed> parsed = new ArrayList<>();
		for (SlotRow row : rows) {
			Optional<LocalTime> start = time(row.start());
			Optional<LocalTime> end = time(row.end());
			Integer capacity = row.capacity();
			if (start.isEmpty() || end.isEmpty() || !end.get().isAfter(start.get()) || capacity == null || capacity < 0
					|| capacity > MAX_CAPACITY) {
				throw ValidationException.of("slots", FieldError.of("option_invalid"));
			}
			parsed.add(new Parsed(row, start.get(), end.get(), capacity));
		}
		if (parsed.isEmpty()) {
			throw ValidationException.of("slots", FieldError.of("required"));
		}
		if (parsed.size() > MAX_SLOTS) {
			throw ValidationException.of("slots", FieldError.of("too_many", Map.of("max", MAX_SLOTS)));
		}
		List<Parsed> sorted = parsed.stream().sorted((a, b) -> a.start().compareTo(b.start())).toList();
		for (int i = 1; i < sorted.size(); i++) {
			if (sorted.get(i).start().isBefore(sorted.get(i - 1).end())) {
				throw ValidationException.of("slots", FieldError.of("slot_overlap"));
			}
		}

		Map<String, TimeSlot> existing = slots.findByShopIdAndActiveTrueOrderByStart(shopId)
			.stream()
			.collect(Collectors.toMap(TimeSlot::getId, Function.identity()));
		// Önce kaldırılanlar pasife: aynı başlangıç saatli yeni aralık eklenebilsin.
		Set<String> incoming = rows.stream().map(SlotRow::id).filter(id -> id != null).collect(Collectors.toSet());
		existing.values().stream().filter(s -> !incoming.contains(s.getId())).forEach(TimeSlot::deactivate);
		slots.flush();
		LocalDate today = today(shopId);
		for (Parsed p : sorted) {
			TimeSlot slot = p.row().id() != null && existing.containsKey(p.row().id()) ? existing.get(p.row().id())
					: new TimeSlot(Ids.newId(), shopId);
			slot.update(p.start(), p.end(), p.capacity());
			slots.saveAndFlush(slot);
			jdbc.sql("""
					UPDATE slot_capacity SET capacity = greatest(:capacity, taken)
					WHERE shop_id = :shopId AND slot_id = :slotId AND date >= :today
					""")
				.param("capacity", p.capacity())
				.param("shopId", shopId)
				.param("slotId", slot.getId())
				.param("today", today)
				.update();
		}
	}

	/**
	 * Listeyi olduğu gibi yazar; gelmeyen bölge pasife alınır. Yeni ya da değişen bölgenin ilçe ve
	 * mahallesi İstanbul listesinden olmalı (`zone_invalid`); aynı bölge iki kez yazılamaz
	 * (`zone_duplicate`). Hatalar `zones` alanında.
	 */
	@Transactional
	public void replaceZones(String shopId, List<ZoneRow> input) {
		List<ZoneRow> rows = input == null ? List.of() : input;
		if (rows.isEmpty()) {
			throw ValidationException.of("zones", FieldError.of("required"));
		}
		if (rows.size() > MAX_ZONES) {
			throw ValidationException.of("zones", FieldError.of("too_many", Map.of("max", MAX_ZONES)));
		}
		Map<String, DeliveryZone> existing = zones.findByShopId(shopId)
			.stream()
			.collect(Collectors.toMap(DeliveryZone::getId, Function.identity()));
		Set<String> seen = new HashSet<>();
		Map<ZoneRow, String[]> cleaned = new HashMap<>();
		for (ZoneRow row : rows) {
			String district = blankToNull(row.district());
			String neighborhood = blankToNull(row.neighborhood());
			if (district == null || row.fee() == null || row.fee() < 0 || row.fee() > MAX_FEE) {
				throw ValidationException.of("zones", FieldError.of("option_invalid"));
			}
			DeliveryZone old = row.id() == null ? null : existing.get(row.id());
			boolean unchanged = old != null && old.getDistrict().equals(district)
					&& Objects.equals(old.getNeighborhood(), neighborhood);
			if (!unchanged && !places.contains(district, neighborhood)) {
				throw ValidationException.of("zones", FieldError.of("zone_invalid"));
			}
			if (!seen.add(district + "|" + (neighborhood == null ? "" : neighborhood))) {
				throw ValidationException.of("zones", FieldError.of("zone_duplicate"));
			}
			cleaned.put(row, new String[] { district, neighborhood });
		}
		Set<String> incoming = rows.stream().map(ZoneRow::id).filter(id -> id != null).collect(Collectors.toSet());
		existing.values().stream().filter(z -> z.isActive() && !incoming.contains(z.getId())).forEach(DeliveryZone::deactivate);
		int position = 1;
		for (ZoneRow row : rows) {
			String[] names = cleaned.get(row);
			DeliveryZone zone = row.id() != null && existing.containsKey(row.id()) ? existing.get(row.id())
					: new DeliveryZone(Ids.newId(), shopId);
			zone.update(names[0], names[1], row.fee(), position++);
			zones.save(zone);
		}
	}

	/** Bugünden bir yıl sonrasına kadar; o güne ayrılmış yer sayısıyla döner (`date_out_of_range`). */
	@Transactional
	public ClosedDay addClosedDay(String shopId, String dateText) {
		LocalDate today = today(shopId);
		LocalDate date;
		try {
			date = LocalDate.parse(dateText == null ? "" : dateText);
		}
		catch (DateTimeParseException ex) {
			throw ValidationException.of("date", FieldError.of("required"));
		}
		if (date.isBefore(today) || date.isAfter(today.plusDays(CLOSED_DAY_WINDOW))) {
			throw ValidationException.of("date", FieldError.of("date_out_of_range"));
		}
		jdbc.sql("INSERT INTO closed_day (shop_id, date) VALUES (:shopId, :date) ON CONFLICT DO NOTHING")
			.param("shopId", shopId)
			.param("date", date)
			.update();
		int reserved = jdbc.sql("SELECT coalesce(sum(taken), 0) FROM slot_capacity WHERE shop_id = :shopId AND date = :date")
			.param("shopId", shopId)
			.param("date", date)
			.query(Integer.class)
			.single();
		return new ClosedDay(date, reserved);
	}

	@Transactional
	public boolean removeClosedDay(String shopId, LocalDate date) {
		return jdbc.sql("DELETE FROM closed_day WHERE shop_id = :shopId AND date = :date")
			.param("shopId", shopId)
			.param("date", date)
			.update() > 0;
	}

	private LocalDate today(String shopId) {
		ShopInfo shop = shops.find(shopId).orElseThrow();
		return LocalDate.now(clock.withZone(shop.timeZone()));
	}

	private static Optional<LocalTime> time(String text) {
		try {
			return Optional.of(LocalTime.parse(text == null ? "" : text.strip()));
		}
		catch (RuntimeException ex) {
			return Optional.empty();
		}
	}

	private static String blankToNull(String value) {
		return value == null || value.isBlank() ? null : value.strip();
	}
}
