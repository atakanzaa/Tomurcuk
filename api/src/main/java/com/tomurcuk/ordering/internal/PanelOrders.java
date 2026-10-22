package com.tomurcuk.ordering.internal;

import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.Year;
import java.time.ZonedDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.regex.Pattern;

import com.tomurcuk.catalog.Catalog;
import com.tomurcuk.catalog.ProductInfo;
import com.tomurcuk.customer.CustomerRecord;
import com.tomurcuk.customer.Customers;
import com.tomurcuk.customer.SpecialDay;
import com.tomurcuk.delivery.DeliverySchedule;
import com.tomurcuk.delivery.SlotInfo;
import com.tomurcuk.delivery.ZoneInfo;
import com.tomurcuk.identity.Permission;
import com.tomurcuk.identity.ShopPrincipal;
import com.tomurcuk.ordering.OrderSource;
import com.tomurcuk.ordering.OrderStatus;
import com.tomurcuk.ordering.OrderStatusChanged;
import com.tomurcuk.ordering.PaymentMethod;
import com.tomurcuk.ordering.PaymentStatus;
import com.tomurcuk.shared.ClockTimes;
import com.tomurcuk.shared.FieldError;
import com.tomurcuk.shared.Ids;
import com.tomurcuk.shared.Phones;
import com.tomurcuk.shared.ValidationException;
import com.tomurcuk.shop.ShopDirectory;
import com.tomurcuk.shop.ShopInfo;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Satıcı paneli. Her işlem oturumdaki kullanıcının dükkânıyla sınırlıdır; başka dükkânın
 * kaydı bulunamaz (404 ya da `draft_incomplete`, varlığı ele verilmez).
 */
@Service
public class PanelOrders {

	/** Elle girilen sipariş için en uzak gün. */
	static final int MANUAL_WINDOW_DAYS = 60;

	private static final int MAX_QUANTITY = 20;

	private static final int CARD_NOTE_MAX = 250;

	private static final Pattern CLOCK = Pattern.compile("([01]\\d|2[0-3]):[0-5]\\d");

	private static final Locale TR = Locale.forLanguageTag("tr");

	private final OrderStore orders;

	private final Customers customers;

	private final Catalog catalog;

	private final DeliverySchedule schedule;

	private final ShopDirectory shops;

	private final ApplicationEventPublisher events;

	private final Clock clock;

	PanelOrders(OrderStore orders, Customers customers, Catalog catalog, DeliverySchedule schedule,
			ShopDirectory shops, ApplicationEventPublisher events, Clock clock) {
		this.orders = orders;
		this.customers = customers;
		this.catalog = catalog;
		this.schedule = schedule;
		this.shops = shops;
		this.events = events;
		this.clock = clock;
	}

	public List<Order> list(ShopPrincipal user, LocalDate from, LocalDate to) {
		return orders.findByDeliveryDate(user.shopId(), from, to);
	}

	public Optional<Order> get(ShopPrincipal user, String orderId) {
		return orders.find(user.shopId(), orderId);
	}

	/**
	 * Yalnızca izin verilen geçişler. İptal `ORDER_CANCEL` izni ister ve siparişin aralığını
	 * boşaltır. Bildirimler {@link OrderStatusChanged} dinleyicilerinde gönderilir.
	 */
	@Transactional
	public Order changeStatus(ShopPrincipal user, String orderId, OrderStatus next) {
		Order order = orders.find(user.shopId(), orderId).orElseThrow(PanelOrders::invalidStatus);
		if (!order.status().canBecome(next)) {
			throw invalidStatus();
		}
		if (next == OrderStatus.CANCELLED && !user.can(Permission.ORDER_CANCEL)) {
			throw new AccessDeniedException("Sipariş iptali için yetki yok");
		}
		ShopInfo shop = shops.find(user.shopId()).orElseThrow();
		LocalTime now = ZonedDateTime.now(clock.withZone(shop.timeZone())).toLocalTime().truncatedTo(ChronoUnit.MINUTES);
		if (orders.changeStatus(user.shopId(), orderId, order.status(), next, now) == 0) {
			throw invalidStatus();
		}
		orders.addEvent(orderId, next, clock.instant(), user.name());
		if (next == OrderStatus.CANCELLED && order.timeSlotId() != null) {
			schedule.release(order.shopId(), order.deliveryDate(), order.timeSlotId());
		}
		events.publishEvent(new OrderStatusChanged(orderId, order.shopId(), order.status(), next));
		return orders.find(user.shopId(), orderId).orElseThrow();
	}

	/** Havale ve kapıda ödemede dükkân işaretler. Zaten ödenmişse sipariş olduğu gibi döner. */
	@Transactional
	public Order markPaid(ShopPrincipal user, String orderId) {
		orders.find(user.shopId(), orderId)
			.orElseThrow(() -> ValidationException.of("payment", FieldError.of("draft_incomplete")));
		orders.markPaid(user.shopId(), orderId);
		return orders.find(user.shopId(), orderId).orElseThrow();
	}

	/** Son siparişi yeniden eskiye. */
	public List<CustomerSummary> customers(ShopPrincipal user, String query) {
		Map<String, OrderStore.CustomerTotals> totals = orders.customerTotals(user.shopId());
		return customers.search(user.shopId(), query)
			.stream()
			.map(c -> CustomerSummary.of(c, totals.get(c.id())))
			.sorted(Comparator.comparing((CustomerSummary c) -> c.lastOrderAt() == null ? "" : c.lastOrderAt().toString())
				.reversed())
			.toList();
	}

	public Optional<CustomerDetail> customer(ShopPrincipal user, String customerId) {
		return customers.find(user.shopId(), customerId)
			.map(c -> new CustomerDetail(summary(user.shopId(), c), orders.findByCustomer(user.shopId(), c.id()),
					customers.specialDays(c.id())));
	}

	/** Elle sipariş ekranında: telefon yazılınca müşteri ve son siparişi. */
	public Optional<CustomerWithLastOrder> customerByPhone(ShopPrincipal user, String phone) {
		return Phones.normalize(phone)
			.flatMap(p -> customers.findByPhone(user.shopId(), p))
			.map(c -> CustomerWithLastOrder.of(summary(user.shopId(), c),
					orders.findByCustomer(user.shopId(), c.id()).stream().findFirst().orElse(null)));
	}

	/**
	 * Bugünden itibaren `days` gün içindeki özel günler, tarih sırasıyla. 29 Şubat artık yıl
	 * olmayan yılda 28 Şubat'tır. Geçen yıl o günlerde (±3 gün) verilen sipariş varsa eklenir.
	 */
	public List<Reminder> reminders(ShopPrincipal user, int days) {
		ShopInfo shop = shops.find(user.shopId()).orElseThrow();
		LocalDate today = LocalDate.now(clock.withZone(shop.timeZone()));
		Map<String, OrderStore.CustomerTotals> totals = orders.customerTotals(user.shopId());
		List<Reminder> reminders = new ArrayList<>();
		for (SpecialDay day : customers.specialDaysOfShop(user.shopId())) {
			LocalDate date = occurrence(day, today.getYear());
			if (date.isBefore(today)) {
				date = occurrence(day, today.getYear() + 1);
			}
			if (ChronoUnit.DAYS.between(today, date) > days) {
				continue;
			}
			CustomerRecord customer = customers.find(user.shopId(), day.customerId()).orElse(null);
			if (customer == null) {
				continue;
			}
			LocalDate lastYear = date.minusDays(365);
			Optional<Order> lastYearOrder = orders.findByCustomer(user.shopId(), customer.id())
				.stream()
				.filter(o -> Math.abs(ChronoUnit.DAYS.between(lastYear, o.deliveryDate())) <= 3)
				.findFirst();
			reminders.add(new Reminder(day, CustomerSummary.of(customer, totals.get(customer.id())), date,
					lastYearOrder
						.map(o -> new Reminder.LastYear(o.items().isEmpty() ? "" : o.items().getFirst().productName(),
								o.total()))
						.orElse(null)));
		}
		reminders.sort(Comparator.comparing(Reminder::date));
		return reminders;
	}

	/**
	 * Telefon ve DM'den gelen sipariş. Ürün, tarih (bugünden 60 gün), aralık ya da kesin saat,
	 * adres (teslim bölgesi adresten bulunur) ve ödeme doğrulanır; aralığın yeri alınır.
	 */
	@Transactional
	public String createManualOrder(ShopPrincipal user, ManualOrderInput input) {
		String shopId = user.shopId();
		ShopInfo shop = shops.find(shopId).orElseThrow();
		Map<String, FieldError> errors = new LinkedHashMap<>();

		OrderSource source = switch (input.source() == null ? "" : input.source()) {
			case "phone" -> OrderSource.PHONE;
			case "whatsapp" -> OrderSource.WHATSAPP;
			case "instagram" -> OrderSource.INSTAGRAM;
			case "store" -> OrderSource.STORE;
			case "ciceksepeti" -> OrderSource.CICEKSEPETI;
			default -> null;
		};
		if (source == null) {
			errors.put("source", FieldError.of("required"));
		}
		Optional<String> customerPhone = phone(errors, "customerPhone", input.customerPhone());

		List<Line> lines = new ArrayList<>();
		List<ManualOrderInput.Item> items = input.items() == null ? List.of() : input.items();
		for (ManualOrderInput.Item item : items) {
			Optional<ProductInfo> product = catalog.findActiveProduct(shopId, item.productId());
			Optional<ProductInfo.Option> option = product.flatMap(p -> p.options()
				.stream()
				.filter(o -> o.id().equals(item.optionId()))
				.findFirst());
			boolean optionOk = item.optionId() == null || option.isPresent();
			if (product.isPresent() && optionOk && item.quantity() >= 1 && item.quantity() <= MAX_QUANTITY) {
				lines.add(new Line(product.get(), option.orElse(null), item.quantity()));
			}
		}
		if (lines.isEmpty() || lines.size() != items.size()) {
			errors.put("items", FieldError.of("option_invalid"));
		}

		LocalDate today = LocalDate.now(clock.withZone(shop.timeZone()));
		LocalDate date = null;
		try {
			date = LocalDate.parse(input.date());
		}
		catch (RuntimeException ex) {
			// aşağıda tarih hatası olarak döner
		}
		if (date == null || date.isBefore(today) || ChronoUnit.DAYS.between(today, date) > MANUAL_WINDOW_DAYS) {
			errors.put("date", FieldError.of("date_out_of_range"));
		}
		boolean exact = "exact".equals(input.slotId());
		Optional<SlotInfo> slot = exact ? Optional.empty() : schedule.findSlot(shopId, input.slotId());
		if (!exact && slot.isEmpty()) {
			errors.put("slotId", FieldError.of("required"));
		}
		if (exact && (input.exactTime() == null || !CLOCK.matcher(input.exactTime()).matches())) {
			errors.put("exactTime", FieldError.of("required"));
		}
		String recipientName = input.recipientName() == null ? "" : input.recipientName().strip();
		if (recipientName.isEmpty()) {
			errors.put("recipientName", FieldError.of("required"));
		}
		Optional<String> recipientPhone = phone(errors, "recipientPhone", input.recipientPhone());
		String address = input.address() == null ? "" : input.address().strip();
		Optional<ZoneInfo> zone = detectZone(schedule.activeZones(shopId), address);
		if (address.isEmpty()) {
			errors.put("address", FieldError.of("required"));
		}
		else if (zone.isEmpty()) {
			errors.put("address", FieldError.of("zone_invalid"));
		}
		String cardNote = input.cardNote() == null ? "" : input.cardNote().strip();
		if (cardNote.length() > CARD_NOTE_MAX) {
			errors.put("cardNote", FieldError.of("too_long", Map.of("max", CARD_NOTE_MAX)));
		}
		PaymentStatus paymentStatus = switch (input.payment() == null ? "" : input.payment()) {
			case "paid" -> PaymentStatus.PAID;
			case "cash", "transfer" -> PaymentStatus.PENDING;
			default -> null;
		};
		if (paymentStatus == null) {
			errors.put("payment", FieldError.of("payment_method_invalid"));
		}
		if (!errors.isEmpty()) {
			throw new ValidationException(errors);
		}
		if (slot.isPresent() && !schedule.takeForOrder(shopId, date, slot.get().id())) {
			throw ValidationException.of("slotId", FieldError.of("slot_full", Map.of("single", 1)));
		}

		String customerId = customers.recordSender(shopId, customerPhone.get(), input.customerName());
		CustomerRecord customer = customers.find(shopId, customerId).orElseThrow();
		String orderId = Ids.newId();
		List<Order.Item> orderItems = new ArrayList<>();
		long subtotal = 0;
		for (Line line : lines) {
			long extra = line.option() == null ? 0 : line.option().extraPrice();
			subtotal += (line.product().price() + extra) * line.quantity();
			orderItems.add(new Order.Item(orderId + "_i" + (orderItems.size() + 1), orderId, line.product().id(),
					line.product().name(), line.product().price(), line.quantity(),
					line.option() == null ? List.of()
							: List.of(new Order.ItemOption(line.option().name(), line.option().kind(),
									line.option().extraPrice()))));
		}
		ZoneInfo z = zone.get();
		String slotStart = slot.map(s -> ClockTimes.format(s.start())).orElse(input.exactTime());
		String slotEnd = slot.map(s -> ClockTimes.format(s.end())).orElse(input.exactTime());
		var now = clock.instant();
		Order order = new Order(orderId, "T-" + orders.nextNumber(shopId), shopId, customerId, source, OrderStatus.NEW,
				paymentStatus, "transfer".equals(input.payment()) ? PaymentMethod.TRANSFER : PaymentMethod.CASH, date,
				slot.map(SlotInfo::id).orElse(null), slotStart, slotEnd, exact ? input.exactTime() : null, exact, z.id(),
				z.neighborhood() == null || z.neighborhood().isBlank() ? z.district()
						: z.neighborhood() + ", " + z.district(),
				recipientName, recipientPhone.get(), address, null, cardNote.isEmpty() ? null : cardNote, null, false,
				orderItems, subtotal, z.fee(), subtotal + z.fee(), null, now, Ids.token(16), customer.phone(), null,
				List.of(new Order.Event(OrderStatus.NEW, now)));
		orders.insert(order, null);
		return orderId;
	}

	private CustomerSummary summary(String shopId, CustomerRecord customer) {
		return CustomerSummary.of(customer, orders.customerTotals(shopId).get(customer.id()));
	}

	private static Optional<String> phone(Map<String, FieldError> errors, String field, String value) {
		if (value == null || value.isBlank()) {
			errors.put(field, FieldError.of("required"));
			return Optional.empty();
		}
		Optional<String> normalized = Phones.normalize(value);
		if (normalized.isEmpty()) {
			errors.put(field, FieldError.of("phone_invalid"));
		}
		return normalized;
	}

	/** Adreste geçen mahalle (yoksa ilçe) adıyla teslim bölgesi; web/lib/zones.ts ile aynı kural. */
	static Optional<ZoneInfo> detectZone(List<ZoneInfo> zones, String address) {
		String text = address.toLowerCase(TR);
		if (text.isBlank()) {
			return Optional.empty();
		}
		return zones.stream()
			.filter(z -> z.neighborhood() != null && !z.neighborhood().isBlank()
					&& text.contains(z.neighborhood().toLowerCase(TR)))
			.findFirst()
			.or(() -> zones.stream()
				.filter(z -> (z.neighborhood() == null || z.neighborhood().isBlank())
						&& text.contains(z.district().toLowerCase(TR)))
				.findFirst());
	}

	private static LocalDate occurrence(SpecialDay day, int year) {
		int dayOfMonth = day.month() == 2 && day.day() == 29 && !Year.isLeap(year) ? 28 : day.day();
		return LocalDate.of(year, day.month(), dayOfMonth);
	}

	private static ValidationException invalidStatus() {
		return ValidationException.of("status", FieldError.of("draft_incomplete"));
	}

	private record Line(ProductInfo product, ProductInfo.Option option, int quantity) {
	}

	public record ManualOrderInput(String source, String customerPhone, String customerName, List<Item> items,
			String date, String slotId, String exactTime, String recipientName, String recipientPhone, String address,
			String cardNote, String payment) {

		public record Item(String productId, String optionId, int quantity) {
		}
	}
}
