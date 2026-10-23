package com.tomurcuk.discovery;

import java.text.Collator;
import java.time.Clock;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.TreeSet;
import java.util.function.Function;
import java.util.stream.Collectors;

import com.tomurcuk.catalog.Catalog;
import com.tomurcuk.catalog.ProductCard;
import com.tomurcuk.delivery.DeliveryDay;
import com.tomurcuk.delivery.DeliverySchedule;
import com.tomurcuk.delivery.SlotInfo;
import com.tomurcuk.delivery.ZoneInfo;
import com.tomurcuk.shared.ClockTimes;
import com.tomurcuk.shared.FieldError;
import com.tomurcuk.shared.ValidationException;
import com.tomurcuk.shop.ShopDirectory;
import com.tomurcuk.shop.ShopInfo;
import com.tomurcuk.shop.ShopView;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Alıcı ana sayfası: semt ve güne göre teslim edebilen dükkânlar ve öne çıkan ürünler. Sipariş
 * her zaman dükkânın kendi sayfasında verilir; bu modül yalnızca okur.
 *
 * <p>
 * Sıra yalnızca teslim edebilmeye göredir: önce sipariş verilebilenler, aralarında ilk müsait
 * aralığı erken olan; sonra o gün veremeyenler. Ücretle öne çıkma yok.
 */
@Service
@Transactional(readOnly = true)
public class Discovery {

	/** "Bugün"ün başvuru saati; dükkânlar kendi saat dilimiyle hesaplanır. */
	static final ZoneId PLATFORM_ZONE = ZoneId.of("Europe/Istanbul");

	static final int PRODUCTS_PER_SHOP = 3;

	private static final Collator TR = Collator.getInstance(Locale.forLanguageTag("tr"));

	private final ShopDirectory shops;

	private final DeliverySchedule schedule;

	private final Catalog catalog;

	private final Clock clock;

	Discovery(ShopDirectory shops, DeliverySchedule schedule, Catalog catalog, Clock clock) {
		this.shops = shops;
		this.schedule = schedule;
		this.catalog = catalog;
		this.clock = clock;
	}

	/** Aktif dükkânların aktif bölgeleri, ilçe ve mahalle adına göre. */
	public List<Area> areas() {
		Comparator<String> text = Comparator.nullsFirst(TR::compare);
		TreeSet<Area> areas = new TreeSet<>(
				Comparator.comparing(Area::district, text).thenComparing(Area::neighborhood, text));
		for (ShopView shop : activeShops()) {
			for (ZoneInfo zone : schedule.activeZones(shop.id())) {
				areas.add(new Area(zone.district(), zone.neighborhood()));
			}
		}
		return List.copyOf(areas);
	}

	/**
	 * `date` günü verilen semte teslim eden dükkânlar. Mahalle verilmişse mahalleye ve ilçenin
	 * tamamına teslim edenler, verilmemişse yalnızca ilçenin tamamına teslim edenler.
	 */
	public List<ShopMatch> shops(String district, String neighborhood, LocalDate date) {
		LocalDate today = LocalDate.now(clock.withZone(PLATFORM_ZONE));
		long offset = date == null ? -1 : ChronoUnit.DAYS.between(today, date);
		if (offset < 0 || offset >= DeliverySchedule.BOOKING_WINDOW_DAYS) {
			throw ValidationException.of("date", FieldError.of("date_out_of_range"));
		}
		List<Ranked> matches = new ArrayList<>();
		for (ShopView view : activeShops()) {
			Optional<ZoneInfo> zone = schedule.activeZones(view.id())
				.stream()
				.filter(z -> z.district().equals(district)
						&& (z.neighborhood() == null || Objects.equals(z.neighborhood(), neighborhood)))
				.min(Comparator.comparingLong(ZoneInfo::fee));
			Optional<ShopInfo> info = shops.find(view.id());
			if (zone.isPresent() && info.isPresent()) {
				matches.add(match(view, info.get(), zone.get(), date));
			}
		}
		return matches.stream()
			.sorted(Comparator.comparing((Ranked r) -> r.match().availability() != Availability.OPEN)
				.thenComparing(Ranked::firstStart, Comparator.nullsLast(Comparator.naturalOrder()))
				.thenComparing(r -> r.match().name(), TR::compare))
			.map(Ranked::match)
			.toList();
	}

	/** Her dükkândan sırayla birer ürün; dükkânın öne çıkardığı ürün önce. */
	public List<Pick> picks(int limit) {
		List<List<Pick>> perShop = activeShops().stream()
			.map(shop -> catalog.cards(shop.id(), shop.featuredProductId(), limit)
				.stream()
				.map(card -> new Pick(shop.slug(), shop.name(), card))
				.toList())
			.filter(list -> !list.isEmpty())
			.toList();
		List<Pick> picks = new ArrayList<>();
		for (int round = 0; picks.size() < limit; round++) {
			boolean added = false;
			for (List<Pick> list : perShop) {
				if (round < list.size() && picks.size() < limit) {
					picks.add(list.get(round));
					added = true;
				}
			}
			if (!added) {
				break;
			}
		}
		return picks;
	}

	private Ranked match(ShopView view, ShopInfo info, ZoneInfo zone, LocalDate date) {
		List<DeliveryDay> days = schedule.days(info, DeliverySchedule.BOOKING_WINDOW_DAYS);
		Map<String, SlotInfo> slots = days.stream()
			.flatMap(day -> day.slots().stream())
			.map(DeliveryDay.SlotRemaining::slotId)
			.distinct()
			.map(id -> schedule.findSlot(info.id(), id))
			.flatMap(Optional::stream)
			.collect(Collectors.toMap(SlotInfo::id, Function.identity()));

		DeliveryDay day = days.stream().filter(d -> d.date().equals(date)).findFirst().orElse(null);
		List<SlotInfo> open = day == null ? List.of() : openSlots(day, slots);
		Availability availability = day == null || day.closed() ? Availability.CLOSED
				: day.sameDayClosed() ? Availability.SAME_DAY_CLOSED
						: open.isEmpty() ? Availability.FULL : Availability.OPEN;
		boolean today = !days.isEmpty() && days.getFirst().date().equals(date);
		String cutoff = availability == Availability.OPEN && today ? ClockTimes.format(info.sameDayCutoff()) : null;

		ShopMatch.NextSlot next = null;
		if (availability != Availability.OPEN) {
			next = days.stream()
				.filter(d -> d.date().isAfter(date))
				.map(d -> openSlots(d, slots).stream()
					.findFirst()
					.map(s -> new ShopMatch.NextSlot(d.date(), ClockTimes.format(s.start()), ClockTimes.format(s.end()))))
				.flatMap(Optional::stream)
				.findFirst()
				.orElse(null);
		}
		List<ProductCard> products = catalog.cards(view.id(), view.featuredProductId(), PRODUCTS_PER_SHOP);
		ShopMatch match = new ShopMatch(view.slug(), view.name(), view.address(), view.descriptionShort(), zone.fee(),
				availability, cutoff,
				open.stream().map(s -> new ShopMatch.Slot(ClockTimes.format(s.start()), ClockTimes.format(s.end()))).toList(),
				next, products);
		return new Ranked(match, open.isEmpty() ? null : open.getFirst().start().toString());
	}

	private static List<SlotInfo> openSlots(DeliveryDay day, Map<String, SlotInfo> slots) {
		if (day.closed() || day.sameDayClosed()) {
			return List.of();
		}
		return day.slots()
			.stream()
			.filter(s -> s.remaining() > 0)
			.map(s -> slots.get(s.slotId()))
			.filter(Objects::nonNull)
			.sorted(Comparator.comparing(SlotInfo::start))
			.toList();
	}

	private List<ShopView> activeShops() {
		return shops.all().stream().filter(ShopView::active).toList();
	}

	private record Ranked(ShopMatch match, String firstStart) {
	}
}
