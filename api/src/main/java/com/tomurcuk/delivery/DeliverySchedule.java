package com.tomurcuk.delivery;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZonedDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

import com.tomurcuk.shared.Instants;
import com.tomurcuk.delivery.internal.DeliveryZoneRepository;
import com.tomurcuk.delivery.internal.TimeSlot;
import com.tomurcuk.delivery.internal.TimeSlotRepository;
import com.tomurcuk.shared.ClockTimes;
import com.tomurcuk.shared.FieldError;
import com.tomurcuk.shop.ShopInfo;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Teslimat takvimi, aralık kapasitesi ve 10 dakikalık rezervasyon.
 *
 * <p>
 * Kapasite `slot_capacity.taken` sayacıyla tutulur: verilen siparişler ve geçerli rezervasyonlar.
 * Artış `taken < capacity` koşuluyla tek UPDATE'tir; aynı aralığa eşzamanlı istekler satır
 * kilidinde sıraya girer ve kapasite aşılmaz. "Bugün" ve son sipariş saati dükkânın saat
 * diliminde, sunucunun saatiyle hesaplanır.
 */
@Service
@Transactional
public class DeliverySchedule {

	/** Alıcının seçebileceği en uzak gün, bugün dahil (web/lib/checkout/limits.ts). */
	public static final int BOOKING_WINDOW_DAYS = 14;

	private final JdbcClient jdbc;

	private final Clock clock;

	private final TimeSlotRepository slots;

	private final DeliveryZoneRepository zones;

	DeliverySchedule(JdbcClient jdbc, Clock clock, TimeSlotRepository slots, DeliveryZoneRepository zones) {
		this.jdbc = jdbc;
		this.clock = clock;
		this.slots = slots;
		this.zones = zones;
	}

	@Transactional(readOnly = true)
	public List<DeliveryDay> days(ShopInfo shop, int count) {
		ZonedDateTime now = ZonedDateTime.now(clock.withZone(shop.timeZone()));
		LocalDate today = now.toLocalDate();
		LocalTime time = now.toLocalTime().truncatedTo(ChronoUnit.MINUTES);
		int days = Math.max(0, Math.min(count, BOOKING_WINDOW_DAYS));
		LocalDate last = today.plusDays(Math.max(days - 1, 0));

		List<TimeSlot> template = slots.findByShopIdOrderByStart(shop.id());
		Set<LocalDate> closed = new HashSet<>(jdbc
			.sql("SELECT date FROM closed_day WHERE shop_id = :shopId AND date BETWEEN :from AND :to")
			.param("shopId", shop.id())
			.param("from", today)
			.param("to", last)
			.query(LocalDate.class)
			.list());
		Map<String, Integer> remaining = new HashMap<>();
		jdbc.sql("""
				SELECT date, slot_id, capacity - taken AS remaining FROM slot_capacity
				WHERE shop_id = :shopId AND date BETWEEN :from AND :to
				""")
			.param("shopId", shop.id())
			.param("from", today)
			.param("to", last)
			.query((rs, n) -> remaining.put(key(rs.getObject("date", LocalDate.class), rs.getString("slot_id")),
					Math.max(0, rs.getInt("remaining"))))
			.list();

		List<DeliveryDay> result = new ArrayList<>(days);
		for (int offset = 0; offset < days; offset++) {
			LocalDate date = today.plusDays(offset);
			boolean isToday = offset == 0;
			boolean isClosed = closed.contains(date);
			List<DeliveryDay.SlotRemaining> daySlots = isClosed ? List.of()
					: template.stream()
						.filter(slot -> !isToday || slot.getStart().isAfter(time))
						.map(slot -> new DeliveryDay.SlotRemaining(slot.getId(),
								remaining.getOrDefault(key(date, slot.getId()), slot.getCapacity())))
						.toList();
			result.add(new DeliveryDay(date, isClosed, isToday && !time.isBefore(shop.sameDayCutoff()), daySlots));
		}
		return result;
	}

	/**
	 * Seçilen gün ve aralık hâlâ verilebilir mi. Taslağın kendi rezervasyonu dolulukta sayılmaz.
	 * Alanlar: `date` (date_out_of_range, day_closed, same_day_closed), `slotId` (required,
	 * slot_full + alternatif aralık).
	 */
	@Transactional(readOnly = true)
	public Map<String, FieldError> check(ShopInfo shop, String dateText, String slotId, String draftId) {
		LocalDate today = LocalDate.now(clock.withZone(shop.timeZone()));
		LocalDate date;
		try {
			date = LocalDate.parse(dateText);
		}
		catch (RuntimeException ex) {
			return Map.of("date", FieldError.of("date_out_of_range"));
		}
		long offset = ChronoUnit.DAYS.between(today, date);
		if (offset < 0 || offset >= BOOKING_WINDOW_DAYS) {
			return Map.of("date", FieldError.of("date_out_of_range"));
		}
		DeliveryDay day = days(shop, (int) offset + 1).get((int) offset);
		if (day.closed()) {
			return Map.of("date", FieldError.of("day_closed"));
		}
		if (day.sameDayClosed()) {
			return Map.of("date",
					FieldError.of("same_day_closed", Map.of("cutoff", ClockTimes.format(shop.sameDayCutoff()))));
		}
		Optional<DeliveryDay.SlotRemaining> slot = day.slots()
			.stream()
			.filter(s -> s.slotId().equals(slotId))
			.findFirst();
		if (slotId == null || slotId.isBlank() || slot.isEmpty()) {
			return Map.of("slotId", FieldError.of("required"));
		}
		int ownHold = holdsSlot(draftId, date, slotId) ? 1 : 0;
		if (slot.get().remaining() + ownHold <= 0) {
			Map<String, Object> meta = new LinkedHashMap<>();
			day.slots()
				.stream()
				.filter(s -> s.remaining() > 0)
				.findFirst()
				.flatMap(s -> findSlot(shop.id(), s.slotId()))
				.ifPresent(alt -> meta.put("alternative",
						ClockTimes.format(alt.start()) + "–" + ClockTimes.format(alt.end())));
			return Map.of("slotId", FieldError.of("slot_full", meta));
		}
		return Map.of();
	}

	@Transactional(readOnly = true)
	public Optional<SlotInfo> findSlot(String shopId, String slotId) {
		return slots.findById(slotId)
			.filter(slot -> slot.getShopId().equals(shopId))
			.map(slot -> new SlotInfo(slot.getId(), slot.getStart(), slot.getEnd()));
	}

	/** Yalnızca aktif bölgeler. */
	@Transactional(readOnly = true)
	public Optional<ZoneInfo> findActiveZone(String shopId, String zoneId) {
		return zones.findById(zoneId)
			.filter(zone -> zone.getShopId().equals(shopId) && zone.isActive())
			.map(zone -> new ZoneInfo(zone.getId(), zone.getDistrict(), zone.getNeighborhood(), zone.getFee()));
	}

	/**
	 * Aralığı taslak için `expiresAt`'e kadar ayırır. Taslak aynı aralığı zaten tutuyorsa süre
	 * uzar; başka aralığı tutuyorsa o bırakılır. Yer kalmadıysa false.
	 */
	public boolean hold(String shopId, String draftId, LocalDate date, String slotId, Instant expiresAt) {
		Optional<Hold> existing = jdbc
			.sql("SELECT date, slot_id FROM slot_hold WHERE draft_id = :draftId FOR UPDATE")
			.param("draftId", draftId)
			.query((rs, n) -> new Hold(rs.getObject("date", LocalDate.class), rs.getString("slot_id")))
			.optional();
		if (existing.isPresent() && existing.get().matches(date, slotId)) {
			jdbc.sql("UPDATE slot_hold SET expires_at = :expiresAt WHERE draft_id = :draftId")
				.param("expiresAt", Instants.sql(expiresAt))
				.param("draftId", draftId)
				.update();
			return true;
		}
		existing.ifPresent(old -> {
			jdbc.sql("DELETE FROM slot_hold WHERE draft_id = :draftId").param("draftId", draftId).update();
			release(shopId, old.date(), old.slotId());
		});
		if (!take(shopId, date, slotId)) {
			return false;
		}
		jdbc.sql("""
				INSERT INTO slot_hold (draft_id, shop_id, date, slot_id, expires_at)
				VALUES (:draftId, :shopId, :date, :slotId, :expiresAt)
				""")
			.param("draftId", draftId)
			.param("shopId", shopId)
			.param("date", date)
			.param("slotId", slotId)
			.param("expiresAt", Instants.sql(expiresAt))
			.update();
		return true;
	}

	/**
	 * Sipariş oluşurken yeri siparişe geçirir. Rezervasyon duruyorsa (süresi geçmiş ama henüz
	 * silinmemiş olsa da) yer zaten sayılmıştır; silinmişse aralık hâlâ boşsa yeniden alınır.
	 */
	public boolean claimForOrder(String shopId, String draftId, LocalDate date, String slotId) {
		Optional<Hold> removed = jdbc.sql("DELETE FROM slot_hold WHERE draft_id = :draftId RETURNING date, slot_id")
			.param("draftId", draftId)
			.query((rs, n) -> new Hold(rs.getObject("date", LocalDate.class), rs.getString("slot_id")))
			.optional();
		if (removed.isPresent()) {
			if (removed.get().matches(date, slotId)) {
				return true;
			}
			release(shopId, removed.get().date(), removed.get().slotId());
		}
		return take(shopId, date, slotId);
	}

	/** İptal edilen siparişin ya da bırakılan rezervasyonun yerini boşaltır. */
	public void release(String shopId, LocalDate date, String slotId) {
		jdbc.sql("""
				UPDATE slot_capacity SET taken = taken - 1
				WHERE shop_id = :shopId AND date = :date AND slot_id = :slotId AND taken > 0
				""")
			.param("shopId", shopId)
			.param("date", date)
			.param("slotId", slotId)
			.update();
	}

	/** Süresi dolan rezervasyonları siler ve yerlerini boşaltır. */
	public int releaseExpiredHolds() {
		List<Hold> expired = jdbc.sql("""
				DELETE FROM slot_hold WHERE expires_at < :now
				RETURNING shop_id, date, slot_id
				""")
			.param("now", Instants.sql(clock.instant()))
			.query((rs, n) -> new Hold(rs.getString("shop_id"), rs.getObject("date", LocalDate.class),
					rs.getString("slot_id")))
			.list();
		expired.forEach(hold -> release(hold.shopId(), hold.date(), hold.slotId()));
		return expired.size();
	}

	/** Rezervasyonsuz alınan yer (panelden elle girilen sipariş); yer yoksa false. */
	public boolean takeForOrder(String shopId, LocalDate date, String slotId) {
		return take(shopId, date, slotId);
	}

	/** Dükkânın aktif bölgeleri, dükkânın sırasıyla. */
	@Transactional(readOnly = true)
	public List<ZoneInfo> activeZones(String shopId) {
		return zones.findByShopIdAndActiveTrueOrderByPosition(shopId)
			.stream()
			.map(zone -> new ZoneInfo(zone.getId(), zone.getDistrict(), zone.getNeighborhood(), zone.getFee()))
			.toList();
	}

	/** Gün ve aralığın sayacını şablondan açar ve yer varsa bir artırır. */
	private boolean take(String shopId, LocalDate date, String slotId) {
		jdbc.sql("""
				INSERT INTO slot_capacity (shop_id, date, slot_id, capacity)
				SELECT shop_id, :date, id, capacity FROM time_slot WHERE id = :slotId AND shop_id = :shopId
				ON CONFLICT DO NOTHING
				""")
			.param("shopId", shopId)
			.param("date", date)
			.param("slotId", slotId)
			.update();
		return jdbc.sql("""
				UPDATE slot_capacity SET taken = taken + 1
				WHERE shop_id = :shopId AND date = :date AND slot_id = :slotId AND taken < capacity
				""")
			.param("shopId", shopId)
			.param("date", date)
			.param("slotId", slotId)
			.update() == 1;
	}

	private boolean holdsSlot(String draftId, LocalDate date, String slotId) {
		return draftId != null && jdbc
			.sql("SELECT count(*) FROM slot_hold WHERE draft_id = :draftId AND date = :date AND slot_id = :slotId")
			.param("draftId", draftId)
			.param("date", date)
			.param("slotId", slotId)
			.query(Integer.class)
			.single() > 0;
	}

	private static String key(LocalDate date, String slotId) {
		return date + "|" + slotId;
	}

	private record Hold(String shopId, LocalDate date, String slotId) {

		Hold(LocalDate date, String slotId) {
			this(null, date, slotId);
		}

		boolean matches(LocalDate otherDate, String otherSlotId) {
			return date.equals(otherDate) && slotId.equals(otherSlotId);
		}
	}
}
