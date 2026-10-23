package com.tomurcuk.ordering.internal;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

import com.tomurcuk.catalog.Catalog;
import com.tomurcuk.catalog.OptionKind;
import com.tomurcuk.catalog.ProductInfo;
import com.tomurcuk.customer.Customers;
import com.tomurcuk.delivery.DeliverySchedule;
import com.tomurcuk.delivery.SlotInfo;
import com.tomurcuk.delivery.ZoneInfo;
import com.tomurcuk.ordering.Order;
import com.tomurcuk.ordering.OrderConfirmed;
import com.tomurcuk.ordering.OrderSource;
import com.tomurcuk.ordering.OrderStatus;
import com.tomurcuk.ordering.PaymentMethod;
import com.tomurcuk.ordering.PaymentStatus;
import com.tomurcuk.payment.PaymentProvider;
import com.tomurcuk.payment.Payments;
import com.tomurcuk.shared.ClockTimes;
import com.tomurcuk.shared.FieldError;
import com.tomurcuk.shared.Ids;
import com.tomurcuk.shared.Phones;
import com.tomurcuk.shared.Texts;
import com.tomurcuk.shared.ValidationException;
import com.tomurcuk.shop.ShopDirectory;
import com.tomurcuk.shop.ShopInfo;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.util.UriComponentsBuilder;

/**
 * Alıcı sipariş akışı. Kurallar docs/mvp.md "Edge case'ler"den: her adım sunucuda, sunucunun
 * saatiyle doğrulanır; aralık 10 dakika ayrılır; ödeme başlamadan ürün, fiyat ve aralık
 * yeniden doğrulanır; fiyat siparişe kopyalanır; aynı idempotency anahtarı aynı siparişi döner.
 */
@Service
public class Checkout {

	private static final Logger log = LoggerFactory.getLogger(Checkout.class);

	static final Duration DRAFT_TTL = Duration.ofHours(2);

	static final Duration RESERVATION = Duration.ofMinutes(10);

	private static final int NAME_MAX = 80;

	private static final int ADDRESS_MAX = 300;

	private static final int COURIER_NOTE_MAX = 200;

	private static final int CARD_NOTE_MAX = 250;

	private static final int SIGNATURE_MAX = 60;

	private final DraftStore drafts;

	private final OrderStore orders;

	private final ShopDirectory shops;

	private final Catalog catalog;

	private final DeliverySchedule schedule;

	private final Customers customers;

	private final Payments payments;

	private final Clock clock;

	private final TransactionTemplate tx;

	private final String webUrl;

	private final ApplicationEventPublisher events;

	Checkout(DraftStore drafts, OrderStore orders, ShopDirectory shops, Catalog catalog, DeliverySchedule schedule,
			Customers customers, Payments payments, Clock clock, TransactionTemplate tx,
			@Value("${tomurcuk.web-url}") String webUrl, ApplicationEventPublisher events) {
		this.drafts = drafts;
		this.orders = orders;
		this.shops = shops;
		this.catalog = catalog;
		this.schedule = schedule;
		this.customers = customers;
		this.payments = payments;
		this.clock = clock;
		this.tx = tx;
		this.webUrl = webUrl;
		this.events = events;
	}

	public Draft createDraft(String shopId, String productId, List<String> optionIds) {
		ProductInfo product = catalog.findActiveProduct(shopId, productId)
			.orElseThrow(() -> ValidationException.of("product", FieldError.of("product_unavailable")));
		Draft.Item item = buildItem(product, optionIds == null ? List.of() : optionIds);
		Draft draft = new Draft(Ids.token(20), shopId, item, null, null, 0, 0, 0, null,
				clock.instant().plus(DRAFT_TTL))
			.withTotals();
		drafts.insert(draft);
		return draft;
	}

	public Optional<Draft> getDraft(String shopId, String draftId) {
		return drafts.findLive(shopId, draftId, false);
	}

	public Draft saveDelivery(String shopId, String draftId, DeliveryInput input) {
		return tx.execute(status -> {
			ShopInfo shop = shops.find(shopId).orElseThrow(() -> incomplete("date"));
			Draft draft = editableDraft(shopId, draftId, "date");

			Map<String, FieldError> errors = new LinkedHashMap<>(
					schedule.check(shop, input.date(), input.slotId(), draftId));
			String recipientName = Texts.check(errors, "recipientName", input.recipientName(), NAME_MAX, true);
			String recipientPhone = Texts.phone(errors, "recipientPhone", input.recipientPhone());
			Optional<ZoneInfo> zone = schedule.findActiveZone(shopId, input.zoneId());
			if (zone.isEmpty()) {
				errors.put("zoneId", FieldError.of("zone_invalid"));
			}
			// Bölge mahalle düzeyinde değilse mahalle adresin parçası olarak yazılır.
			String neighborhood = zone.map(ZoneInfo::neighborhood).filter(n -> n != null && !n.isBlank())
				.orElseGet(() -> Texts.check(errors, "neighborhood", input.neighborhood(), NAME_MAX, true));
			String address = Texts.check(errors, "address", input.address(), ADDRESS_MAX, true);
			String courierNote = Texts.check(errors, "courierNote", input.courierNote(), COURIER_NOTE_MAX, false);
			if (!errors.isEmpty()) {
				throw new ValidationException(errors);
			}

			LocalDate date = LocalDate.parse(input.date());
			SlotInfo slot = schedule.findSlot(shopId, input.slotId()).orElseThrow();
			Instant reservedUntil = clock.instant().plus(RESERVATION);
			if (!schedule.hold(shopId, draftId, date, slot.id(), reservedUntil)) {
				throw ValidationException.of("slotId", FieldError.of("slot_full"));
			}
			ZoneInfo z = zone.get();
			Draft updated = draft.withDelivery(new Draft.Delivery(input.date(), slot.id(),
					ClockTimes.format(slot.start()), ClockTimes.format(slot.end()), z.id(), z.district(), neighborhood,
					z.fee(), recipientName, recipientPhone, address, courierNote, reservedUntil.toString()));
			drafts.update(updated);
			return updated;
		});
	}

	public Draft saveCard(String shopId, String draftId, CardInput input) {
		return tx.execute(status -> {
			Draft draft = editableDraft(shopId, draftId, "message");
			Map<String, FieldError> errors = new LinkedHashMap<>();
			String message = Texts.check(errors, "message", input.message(), CARD_NOTE_MAX, false);
			String signature = Texts.check(errors, "signature", input.signature(), SIGNATURE_MAX, false);
			String senderPhone = Texts.phone(errors, "senderPhone", input.senderPhone());
			if (!errors.isEmpty()) {
				throw new ValidationException(errors);
			}
			Draft updated = draft
				.withCard(new Draft.Card(message, input.anonymous() ? "" : signature, input.anonymous(), senderPhone));
			drafts.update(updated);
			return updated;
		});
	}

	/**
	 * Siparişi oluşturur. Kartla ödemede sağlayıcının sayfası döner; ödeme yarıda kalırsa aynı
	 * taslakla tekrar çağrılınca aynı sipariş için yeni ödeme sayfası açılır.
	 */
	public Placed placeOrder(String shopId, String draftId, PlaceOrderInput input) {
		Optional<Order> existing = blankToNull(input.idempotencyKey()) == null ? Optional.empty()
				: orders.findByIdempotencyKey(shopId, input.idempotencyKey());
		if (existing.isPresent()) {
			return placed(existing.get(), input.clientIp());
		}
		ShopInfo shop = shops.find(shopId).orElseThrow(() -> incomplete("draft"));
		Draft draft = drafts.findLive(shopId, draftId, false).orElseThrow(() -> incomplete("draft"));
		if (draft.orderId() != null) {
			return placed(orders.find(shopId, draft.orderId()).orElseThrow(() -> incomplete("draft")), input.clientIp());
		}
		if (draft.delivery() == null || draft.card() == null) {
			throw incomplete("draft");
		}
		Map<String, FieldError> errors = new LinkedHashMap<>();
		PaymentMethod method = switch (input.paymentMethod() == null ? "" : input.paymentMethod()) {
			case "card" -> PaymentMethod.CARD;
			case "transfer" -> PaymentMethod.TRANSFER;
			default -> null;
		};
		if (method == null) {
			errors.put("paymentMethod", FieldError.of("payment_method_invalid"));
		}
		if (!input.consent()) {
			errors.put("consent", FieldError.of("consent_required"));
		}
		if (!errors.isEmpty()) {
			throw new ValidationException(errors);
		}

		// Ödeme başlamadan ürün ve fiyat yeniden doğrulanır.
		ProductInfo product = catalog.findActiveProduct(shopId, draft.item().productId())
			.orElseThrow(() -> ValidationException.of("draft", FieldError.of("product_unavailable")));
		Draft.Item current;
		try {
			current = buildItem(product, draft.item().options().stream().map(Draft.Option::id).toList());
		}
		catch (ValidationException ex) {
			throw ValidationException.of("draft", FieldError.of("product_unavailable"));
		}
		if (current.lineTotal() != draft.item().lineTotal()) {
			Draft repriced = draft.withItem(current);
			drafts.update(repriced);
			throw ValidationException.of("draft", FieldError.of("price_changed", Map.of("total", repriced.total())));
		}

		Draft.Delivery delivery = draft.delivery();
		Map<String, FieldError> slotErrors = schedule.check(shop, delivery.date(), delivery.slotId(), draftId);
		if (!slotErrors.isEmpty()) {
			FieldError dateError = slotErrors.get("date");
			throw ValidationException.of("draft", dateError != null ? dateError : FieldError.of("reservation_expired"));
		}

		Order order;
		try {
			order = tx.execute(status -> create(shop, draft, method, input.idempotencyKey()));
		}
		catch (DuplicateKeyException ex) {
			// Aynı anahtarla eşzamanlı ikinci gönderim: ilk sipariş döner.
			return placed(orders.findByIdempotencyKey(shopId, input.idempotencyKey()).orElseThrow(() -> ex),
					input.clientIp());
		}
		return placed(order, input.clientIp());
	}

	/** Ödeme sayfasından dönüş; sonuç sağlayıcıdan alınır, alıcının söylediğine güvenilmez. */
	public Optional<PaymentReturn> completePayment(String shopId, String token) {
		return payments.complete(token)
			.flatMap(outcome -> orders.find(shopId, outcome.orderId()))
			.map(order -> new PaymentReturn(order.trackingToken(), order.paymentStatus() == PaymentStatus.PAID));
	}

	public Optional<Tracking> tracking(String shopId, String token) {
		return orders.findByTrackingToken(shopId, token).map(Tracking::of);
	}

	/** Sipariş numarası ("4821", "t4821", "T-4821") ve gönderen telefonu eşleşirse takip token'ı. */
	public Optional<String> findTrackingToken(String shopId, String number, String phone) {
		String digits = number == null ? "" : number.strip().toUpperCase().replaceFirst("^T-?", "");
		if (digits.isEmpty()) {
			return Optional.empty();
		}
		return Phones.normalize(phone).flatMap(p -> orders.findTrackingToken(shopId, "T-" + digits, p));
	}

	/** Alıcı ana sayfasından: dükkân bilinmeden, sipariş numarası ve gönderen telefonuyla. */
	public Optional<OrderStore.TrackingRef> findTrackingRef(String number, String phone) {
		String digits = number == null ? "" : number.strip().toUpperCase().replaceFirst("^T-?", "");
		if (digits.isEmpty()) {
			return Optional.empty();
		}
		return Phones.normalize(phone).flatMap(p -> orders.findTrackingRef("T-" + digits, p));
	}

	private Order create(ShopInfo shop, Draft draft, PaymentMethod method, String idempotencyKey) {
		Draft locked = drafts.findLive(shop.id(), draft.id(), true).orElseThrow(() -> incomplete("draft"));
		if (locked.orderId() != null) {
			return orders.find(shop.id(), locked.orderId()).orElseThrow(() -> incomplete("draft"));
		}
		Draft.Delivery delivery = draft.delivery();
		Draft.Card card = draft.card();
		if (!schedule.claimForOrder(shop.id(), draft.id(), LocalDate.parse(delivery.date()), delivery.slotId())) {
			throw ValidationException.of("draft", FieldError.of("reservation_expired"));
		}
		Instant now = clock.instant();
		String orderId = Ids.newId();
		Order order = new Order(orderId, "T-" + orders.nextNumber(shop.id()), shop.id(),
				customers.recordSender(shop.id(), card.senderPhone(), card.signature()), OrderSource.LINK,
				OrderStatus.NEW, PaymentStatus.PENDING, method, LocalDate.parse(delivery.date()), delivery.slotId(),
				delivery.slotStart(), delivery.slotEnd(), null, false, delivery.zoneId(),
				delivery.neighborhood() + ", " + delivery.district(), delivery.recipientName(),
				delivery.recipientPhone(),
				delivery.address() + ", " + delivery.neighborhood() + ", " + delivery.district(),
				blankToNull(delivery.courierNote()), blankToNull(card.message()), blankToNull(card.signature()),
				card.anonymous(),
				List.of(new Order.Item(orderId + "_i1", orderId, draft.item().productId(),
						draft.item().productName(), draft.item().unitPrice(), 1,
						draft.item()
							.options()
							.stream()
							.map(o -> new Order.ItemOption(o.name(), o.kind(), o.extraPrice()))
							.toList())),
				draft.subtotal(), draft.deliveryFee(), draft.total(), null, now, Ids.token(16), card.senderPhone(),
				null, List.of(new Order.Event(OrderStatus.NEW, now)));
		orders.insert(order, blankToNull(idempotencyKey));
		// Havalede sipariş hemen kesinleşir; kartla ödemede ödeme onaylanınca (PaymentListener).
		if (method == PaymentMethod.TRANSFER) {
			events.publishEvent(new OrderConfirmed(Notices.of(order)));
		}
		drafts.update(new Draft(draft.id(), draft.shopId(), draft.item(), delivery, card, draft.subtotal(),
				draft.deliveryFee(), draft.total(), orderId, draft.expiresAt()));
		return order;
	}

	private Placed placed(Order order, String clientIp) {
		boolean needsPayment = order.paymentMethod() == PaymentMethod.CARD
				&& order.paymentStatus() != PaymentStatus.PAID && order.status() == OrderStatus.NEW;
		if (!needsPayment) {
			return new Placed(order.trackingToken(), null);
		}
		ShopInfo shop = shops.find(order.shopId()).orElseThrow();
		String callbackUrl = UriComponentsBuilder.fromUriString(webUrl)
			.pathSegment(shop.slug(), "siparis", "odeme", "sonuc")
			.build()
			.toUriString();
		PaymentProvider.Buyer buyer = new PaymentProvider.Buyer(order.customerId(),
				order.senderName() == null ? "" : order.senderName(), order.senderPhone(), order.address(),
				order.zoneName(), clientIp == null || clientIp.isBlank() ? "127.0.0.1" : clientIp);
		try {
			PaymentProvider.Session session = payments.start(new PaymentProvider.Request(order.id(), order.shopId(),
					order.total(), shop.name() + " siparişi " + order.number(), callbackUrl, buyer));
			return new Placed(order.trackingToken(), session.pageUrl());
		}
		catch (PaymentProvider.Unavailable ex) {
			// Sipariş açık kalır; alıcı biraz sonra yeniden deneyebilir ya da havaleyi seçebilir.
			log.warn("Ödeme sayfası açılamadı: sipariş {}: {}", order.number(), ex.getMessage());
			throw ValidationException.of("draft", FieldError.of("payment_unavailable"));
		}
	}

	/** Ürünün bugünkü fiyatıyla taslak satırı; seçenekler doğrulanır. */
	private static Draft.Item buildItem(ProductInfo product, List<String> optionIds) {
		Set<String> wanted = new HashSet<>(optionIds);
		List<ProductInfo.Option> chosen = product.options().stream().filter(o -> wanted.contains(o.id())).toList();
		if (chosen.size() != wanted.size()) {
			throw ValidationException.of("options", FieldError.of("option_invalid"));
		}
		boolean hasSizes = product.options().stream().anyMatch(o -> o.kind() == OptionKind.SIZE);
		long chosenSizes = chosen.stream().filter(o -> o.kind() == OptionKind.SIZE).count();
		if (hasSizes && chosenSizes != 1) {
			throw ValidationException.of("size", FieldError.of("size_required"));
		}
		List<Draft.Option> options = chosen.stream()
			.map(o -> new Draft.Option(o.id(), o.name(), o.detail(), o.kind(), o.extraPrice()))
			.toList();
		long lineTotal = product.price() + options.stream().mapToLong(Draft.Option::extraPrice).sum();
		return new Draft.Item(product.id(), product.name(), product.price(), options, lineTotal);
	}

	/** Sipariş oluşmuş taslak değiştirilemez; alıcı yeni taslakla başlar. */
	private Draft editableDraft(String shopId, String draftId, String field) {
		Draft draft = drafts.findLive(shopId, draftId, true).orElseThrow(() -> incomplete(field));
		if (draft.orderId() != null) {
			throw incomplete(field);
		}
		return draft;
	}

	private static ValidationException incomplete(String field) {
		return ValidationException.of(field, FieldError.of("draft_incomplete"));
	}

	private static String blankToNull(String value) {
		return value == null || value.isBlank() ? null : value;
	}

	public record DeliveryInput(String date, String slotId, String recipientName, String recipientPhone,
			String zoneId, String neighborhood, String address, String courierNote) {
	}

	public record CardInput(String message, String signature, boolean anonymous, String senderPhone) {
	}

	/** `clientIp` alıcının IP'si; Next sunucusu iletir, ödeme sağlayıcısı ister. */
	public record PlaceOrderInput(String paymentMethod, boolean consent, String idempotencyKey, String clientIp) {
	}

	/** `paymentUrl` doluysa alıcı ödeme sayfasına yönlenir. */
	public record Placed(String trackingToken, String paymentUrl) {
	}

	public record PaymentReturn(String trackingToken, boolean paid) {
	}
}
