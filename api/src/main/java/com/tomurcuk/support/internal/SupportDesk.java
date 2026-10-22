package com.tomurcuk.support.internal;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;

import com.tomurcuk.audit.AuditLog;
import com.tomurcuk.customer.CustomerRecord;
import com.tomurcuk.customer.Customers;
import com.tomurcuk.identity.Impersonation;
import com.tomurcuk.identity.Impersonations;
import com.tomurcuk.identity.Permission;
import com.tomurcuk.identity.PlatformPrincipal;
import com.tomurcuk.identity.PlatformUsers;
import com.tomurcuk.identity.PlatformRole;
import com.tomurcuk.identity.ShopPrincipal;
import com.tomurcuk.identity.ShopRole;
import com.tomurcuk.identity.ShopUsers;
import com.tomurcuk.notification.NotificationLog;
import com.tomurcuk.ordering.Order;
import com.tomurcuk.ordering.OrderDirectory;
import com.tomurcuk.ordering.OrderSource;
import com.tomurcuk.ordering.OrderStatus;
import com.tomurcuk.ordering.PaymentMethod;
import com.tomurcuk.ordering.PaymentStatus;
import com.tomurcuk.payment.PaymentAccounts;
import com.tomurcuk.payment.Payments;
import com.tomurcuk.shared.FieldError;
import com.tomurcuk.shared.Ids;
import com.tomurcuk.shared.Masks;
import com.tomurcuk.shared.Money;
import com.tomurcuk.shared.Texts;
import com.tomurcuk.shared.ValidationException;
import com.tomurcuk.shop.ShopDirectory;
import com.tomurcuk.shop.ShopPlan;
import com.tomurcuk.shop.ShopView;
import com.tomurcuk.support.internal.Views.NotificationView;
import com.tomurcuk.support.internal.Views.ShopOrderView;
import com.tomurcuk.support.internal.Views.ShopOverview;
import com.tomurcuk.support.internal.Views.ShopSummary;
import com.tomurcuk.support.internal.Views.SupportOrderView;
import com.tomurcuk.support.internal.Views.TicketDetail;
import com.tomurcuk.support.internal.Views.TicketSummary;
import com.tomurcuk.support.internal.Views.TimelineEvent;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Müşteri hizmetleri paneli (docs/mvp.md "Destek paneli", "Talep sistemi"). Destek ekibi bütün
 * dükkânları görür; kişisel veri maskelidir, açmak gerekçe ister ve denetim kaydına yazılır.
 */
@Service
public class SupportDesk {

	private static final ZoneId ISTANBUL = ZoneId.of("Europe/Istanbul");

	private static final Locale TR = Locale.forLanguageTag("tr");

	private static final int TEXT_MAX = 4000;

	private static final int NOTE_MAX = 1000;

	private static final int SUBJECT_MAX = 120;

	private final TicketStore tickets;

	private final ShopDirectory shops;

	private final OrderDirectory orders;

	private final Customers customers;

	private final ShopUsers shopUsers;

	private final PlatformUsers supportUsers;

	private final Payments payments;

	private final PaymentAccounts paymentAccounts;

	private final NotificationLog notifications;

	private final Impersonations impersonations;

	private final AuditLog audit;

	private final Clock clock;

	SupportDesk(TicketStore tickets, ShopDirectory shops, OrderDirectory orders, Customers customers,
			ShopUsers shopUsers, PlatformUsers supportUsers, Payments payments,
			PaymentAccounts paymentAccounts, NotificationLog notifications, Impersonations impersonations,
			AuditLog audit, Clock clock) {
		this.tickets = tickets;
		this.shops = shops;
		this.orders = orders;
		this.customers = customers;
		this.shopUsers = shopUsers;
		this.supportUsers = supportUsers;
		this.payments = payments;
		this.paymentAccounts = paymentAccounts;
		this.notifications = notifications;
		this.impersonations = impersonations;
		this.audit = audit;
		this.clock = clock;
	}

	// ---------------------------------------------------------------- talepler

	/** Açık talepler önce, acil olanlar en üstte, en uzun bekleyen önce. */
	@Transactional(readOnly = true)
	public List<TicketSummary> tickets() {
		return tickets.all()
			.stream()
			.map(this::summary)
			.sorted(Comparator.comparing((TicketSummary t) -> t.status().equals("resolved"))
				.thenComparing(t -> !t.priority().equals("urgent"))
				.thenComparing(TicketSummary::waitingSince))
			.toList();
	}

	@Transactional(readOnly = true)
	public Optional<TicketDetail> ticket(String ticketId) {
		return tickets.find(ticketId)
			.map(t -> new TicketDetail(summary(t), tickets.messages(t.id()),
					t.orderId() == null ? null : orders.find(t.orderId()).map(this::orderView).orElse(null)));
	}

	/**
	 * Dükkâna yanıt ya da dahili not. Dükkâna giden ilk yanıt ilk yanıt süresini kapatır; talep
	 * ya dükkânı bekler ya da açık kalır.
	 */
	@Transactional
	public void reply(PlatformPrincipal user, String ticketId, String text, boolean internal, boolean waitForShop) {
		TicketStore.Ticket ticket = tickets.find(ticketId)
			.orElseThrow(() -> ValidationException.of("text", FieldError.of("draft_incomplete")));
		Map<String, FieldError> errors = new LinkedHashMap<>();
		String body = Texts.check(errors, "text", text, TEXT_MAX, true);
		if (!errors.isEmpty()) {
			throw new ValidationException(errors);
		}
		Instant now = clock.instant();
		tickets.addMessage(Ids.newId(), ticket.id(), "platform", user.userId(), user.name(),
				internal ? "dahili not, dükkân görmez" : "Tomurcuk Destek", internal, body, now);
		if (!internal) {
			tickets.markReplied(ticket.id(), user.userId(), waitForShop ? "waiting_shop" : "open", now);
		}
	}

	/** İptal ve iade gibi temsilcinin yetkisi olmayan işler için talebi lidere aktarır. */
	@Transactional
	public boolean escalate(PlatformPrincipal user, String ticketId) {
		Optional<TicketStore.Ticket> ticket = tickets.find(ticketId);
		Optional<PlatformPrincipal> lead = supportUsers.active()
			.stream()
			.filter(u -> u.role() == PlatformRole.LEAD)
			.findFirst();
		if (ticket.isEmpty() || lead.isEmpty()) {
			return false;
		}
		tickets.assign(ticketId, lead.get().userId());
		audit.record(new AuditLog.Entry("platform", user.userId(), user.name(), ticket.get().shopId(),
				"Talep lidere aktarıldı", ticket.get().subject(), null, null));
		return true;
	}

	// ---------------------------------------------------------------- sipariş ve kişisel veri

	/** Gerekçe zorunlu; açılan telefon, kim açtığı ve gerekçe denetim kaydına yazılır. */
	@Transactional
	public Optional<String> revealPhone(PlatformPrincipal user, String orderId, String field, String reason) {
		if (reason == null || reason.isBlank()) {
			throw ValidationException.of("reason", FieldError.of("required"));
		}
		return orders.find(orderId).map(order -> {
			boolean recipient = "recipient".equals(field);
			audit.record(new AuditLog.Entry("platform", user.userId(), user.name(), order.shopId(),
					"Telefon görüntülendi",
					"Sipariş " + order.number() + ", " + (recipient ? "alıcı" : "gönderen") + " telefonu",
					reason.strip(), null));
			return recipient ? order.recipientPhone() : order.senderPhone();
		});
	}

	@Transactional(readOnly = true)
	public List<ShopOrderView> orders() {
		LocalDate today = LocalDate.now(clock.withZone(ISTANBUL));
		Map<String, String> names = shopNames();
		return orders.openOrUpcoming(today)
			.stream()
			.map(o -> new ShopOrderView(orderView(o), names.getOrDefault(o.shopId(), "")))
			.toList();
	}

	// ---------------------------------------------------------------- dükkânlar

	@Transactional(readOnly = true)
	public List<ShopSummary> shops() {
		return shops.all().stream().map(this::shopSummary).toList();
	}

	@Transactional(readOnly = true)
	public Optional<ShopOverview> overview(String shopId) {
		return shops.view(shopId).map(shop -> {
			List<ShopUsers.View> users = shopUsers.ofShop(shopId);
			Optional<ShopUsers.View> last = users.stream()
				.filter(u -> u.lastSeenAt() != null)
				.max(Comparator.comparing(ShopUsers.View::lastSeenAt));
			Instant monthStart = ZonedDateTime.now(clock.withZone(ISTANBUL))
				.withDayOfMonth(1)
				.toLocalDate()
				.atStartOfDay(ISTANBUL)
				.toInstant();
			return new ShopOverview(shopSummary(shop), paymentAccounts.label(shopId),
					last.map(u -> new Views.LastLogin(u.lastSeenAt(), u.name())).orElse(null),
					orders.recent(shopId, 6).stream().map(this::orderView).toList(),
					notifications.forShop(shopId, 20).stream().map(SupportDesk::notificationView).toList(),
					notifications.smsSentSince(shopId, monthStart), smsLimit(shop.plan()), tickets.notes(shopId), users,
					tickets.ofShop(shopId)
						.stream()
						.filter(t -> !t.status().equals("resolved"))
						.map(this::summary)
						.toList());
		});
	}

	/** Ekip notu; dükkân görmez. */
	@Transactional
	public void addNote(PlatformPrincipal user, String shopId, String text) {
		Map<String, FieldError> errors = new LinkedHashMap<>();
		String body = Texts.check(errors, "text", text, NOTE_MAX, true);
		if (!errors.isEmpty()) {
			throw new ValidationException(errors);
		}
		tickets.addNote(Ids.newId(), shopId, user.userId(), Masks.shortName(user.name()), body, clock.instant());
	}

	/** Gerekçeli, 30 dakikalık dükkân adına oturum. */
	@Transactional
	public Optional<Impersonation> impersonate(PlatformPrincipal user, String shopId, String reason) {
		if (!user.can(Permission.SHOP_IMPERSONATE)) {
			throw new AccessDeniedException("Dükkân adına giriş yetkisi yok");
		}
		if (reason == null || reason.isBlank()) {
			throw ValidationException.of("reason", FieldError.of("required"));
		}
		return shops.view(shopId).map(shop -> impersonations.start(user, shopId, shop.name(), reason));
	}

	// ---------------------------------------------------------------- arama, denetim, hazır cevaplar

	/** Sipariş no, telefon, dükkân adı ya da alıcı adıyla tek kutudan arama; arama da kayda geçer. */
	@Transactional
	public Views.SearchResult search(PlatformPrincipal user, String query) {
		String text = query == null ? "" : query.strip().toLowerCase(TR);
		if (text.length() < 2) {
			return new Views.SearchResult(List.of(), List.of(), List.of());
		}
		String digits = text.replaceAll("\\D", "").replaceFirst("^0", "");
		Map<String, String> names = shopNames();
		List<ShopOrderView> foundOrders = orders.search(query)
			.stream()
			.map(o -> new ShopOrderView(orderView(o), names.getOrDefault(o.shopId(), "")))
			.toList();
		List<ShopSummary> foundShops = shops.all()
			.stream()
			.filter(s -> s.name().toLowerCase(TR).contains(text)
					|| (digits.length() >= 4 && s.phone().replaceAll("\\D", "").contains(digits)))
			.map(this::shopSummary)
			.toList();
		List<TicketSummary> foundTickets = tickets.all()
			.stream()
			.filter(t -> t.subject().toLowerCase(TR).contains(text))
			.map(this::summary)
			.toList();
		audit.record(new AuditLog.Entry("platform", user.userId(), user.name(), null, "Global arama",
				"\"" + query.strip() + "\"", null, null));
		return new Views.SearchResult(foundOrders, foundShops, foundTickets);
	}

	/** Lider ve platform sahibi bütün kaydı, temsilci yalnızca kendi işlemlerini görür. */
	public List<AuditLog.View> auditLog(PlatformPrincipal user) {
		return audit.list(user.can(Permission.AUDIT_VIEW_ALL) ? null : user.userId(), 200);
	}

	public List<Views.CannedReply> cannedReplies() {
		return tickets.cannedReplies();
	}

	// ---------------------------------------------------------------- panelden talepler

	@Transactional(readOnly = true)
	public List<TicketSummary> shopTickets(ShopPrincipal user) {
		return tickets.ofShop(user.shopId()).stream().map(this::summary).toList();
	}

	/** Panelden "Yardım" formu. Sipariş numarası yazıldıysa dükkânın siparişi olmalı. */
	@Transactional
	public String openTicket(ShopPrincipal user, String subject, String category, String orderNumber, String text) {
		Map<String, FieldError> errors = new LinkedHashMap<>();
		if (!List.of("payment", "delivery", "technical", "account").contains(category)) {
			errors.put("category", FieldError.of("required"));
		}
		String cleanSubject = Texts.check(errors, "subject", subject, SUBJECT_MAX, true);
		String body = Texts.check(errors, "text", text, TEXT_MAX, true);
		String digits = orderNumber == null ? "" : orderNumber.strip().toUpperCase(TR).replaceFirst("^T-?", "");
		Optional<Order> order = digits.isEmpty() ? Optional.empty()
				: orders.findByNumber(user.shopId(), "T-" + digits);
		if (!digits.isEmpty() && order.isEmpty()) {
			errors.put("orderNumber", FieldError.of("option_invalid"));
		}
		if (!errors.isEmpty()) {
			throw new ValidationException(errors);
		}
		Instant now = clock.instant();
		String id = Ids.newId();
		tickets.insert(new TicketStore.Ticket(id, user.shopId(), order.map(Order::id).orElse(null),
				order.map(Order::number).orElse(null), cleanSubject, category, "normal", "open", null, now, now, null));
		String shopName = shops.view(user.shopId()).map(ShopView::name).orElse("");
		tickets.addMessage(Ids.newId(), id, "shop", user.userId(), user.name(), shopName, false, body, now);
		return id;
	}

	// ---------------------------------------------------------------- görünümler

	/** Bugün teslim edilecek siparişe bağlı açık talep kendiliğinden acildir. */
	private TicketSummary summary(TicketStore.Ticket t) {
		Optional<ShopView> shop = shops.view(t.shopId());
		Optional<Order> order = t.orderId() == null ? Optional.empty() : orders.find(t.orderId());
		ZoneId zone = shop.map(s -> ZoneId.of(s.timeZone())).orElse(ISTANBUL);
		boolean dueToday = order.map(o -> o.deliveryDate().equals(LocalDate.now(clock.withZone(zone)))).orElse(false);
		String priority = dueToday && !t.status().equals("resolved") ? "urgent" : t.priority();
		String assigneeName = t.assigneeId() == null ? null
				: supportUsers.active()
					.stream()
					.filter(u -> u.userId().equals(t.assigneeId()))
					.map(PlatformPrincipal::name)
					.findFirst()
					.orElse(null);
		return new TicketSummary(t.id(), t.subject(), t.shopId(), shop.map(ShopView::name).orElse(""),
				shop.map(s -> district(s.address())).orElse(""), t.orderId(), t.orderNumber(),
				order.map(Order::deliveryDate).orElse(null),
				order.map(o -> new Views.Slot(o.slotStart(), o.slotEnd())).orElse(null), t.category(), priority,
				t.status(), t.assigneeId(), assigneeName, t.createdAt(), t.waitingSince(), t.firstResponseAt());
	}

	private ShopSummary shopSummary(ShopView shop) {
		Instant lastActivity = shopUsers.ofShop(shop.id())
			.stream()
			.map(ShopUsers.View::lastSeenAt)
			.filter(java.util.Objects::nonNull)
			.max(Comparator.naturalOrder())
			.orElse(null);
		int openTickets = (int) tickets.ofShop(shop.id()).stream().filter(t -> !t.status().equals("resolved")).count();
		return new ShopSummary(shop, district(shop.address()), shops.since(shop.id()).orElse(null),
				orders.countSince(shop.id(), clock.instant().minus(Duration.ofDays(30))), openTickets, lastActivity);
	}

	private SupportOrderView orderView(Order order) {
		String senderName = customers.find(order.shopId(), order.customerId())
			.map(CustomerRecord::name)
			.map(Masks::shortName)
			.orElse("");
		return new SupportOrderView(order.id(), order.number(), order.status(), order.paymentStatus(),
				order.paymentMethod(), order.deliveryDate(), order.slotStart(), order.slotEnd(),
				Masks.shortName(order.recipientName()), Masks.phone(order.recipientPhone()),
				String.join(", ", java.util.stream.Stream.of(order.address(), order.zoneName())
					.filter(s -> s != null && !s.isBlank())
					.toList()),
				senderName, Masks.phone(order.senderPhone()), order.total(), timeline(order));
	}

	/** Durum değişiklikleri, ödeme denemeleri ve bildirimler sırayla; "SMS gitti mi" 10 saniyede. */
	private List<TimelineEvent> timeline(Order order) {
		String owner = shopUsers.ofShop(order.shopId())
			.stream()
			.filter(u -> u.role() == ShopRole.OWNER)
			.map(ShopUsers.View::name)
			.findFirst()
			.orElse("Dükkân");
		List<TimelineEvent> events = new ArrayList<>();
		for (Order.Event e : order.events()) {
			if (e.status() == OrderStatus.NEW) {
				boolean fromLink = order.source() == OrderSource.LINK;
				events.add(new TimelineEvent(e.at(), fromLink ? "Sipariş linkten alındı" : "Sipariş elle girildi",
						fromLink ? "Alıcı akışı" : actor(e, owner), false));
				continue;
			}
			String actor = e.status() == OrderStatus.ON_WAY && order.courierName() != null
					? owner + ", kurye " + order.courierName() : actor(e, owner);
			events.add(new TimelineEvent(e.at(), statusText(e.status()), actor, e.status() == OrderStatus.FAILED));
		}
		List<Payments.Attempt> attempts = payments.history(order.id());
		if (attempts.isEmpty() && order.paymentStatus() == PaymentStatus.PAID
				&& order.paymentMethod() == PaymentMethod.CARD && !order.events().isEmpty()) {
			// Örnek siparişlerde ödeme kaydı yok; kartla ödenmiş siparişin onayı sipariş anından sonra gösterilir.
			events.add(new TimelineEvent(order.events().getFirst().at().plusSeconds(60),
					"Ödeme onaylandı, " + Money.format(order.total()), "iyzico", false));
		}
		for (Payments.Attempt a : attempts) {
			switch (a.status()) {
				case "succeeded" -> events.add(new TimelineEvent(a.at(), "Ödeme onaylandı, " + Money.format(a.amount()),
						a.provider(), false));
				case "failed" -> events.add(new TimelineEvent(a.at(), "Ödeme başarısız", a.provider(), true));
				case "abandoned" -> events.add(new TimelineEvent(a.at(), "Ödeme yarıda kaldı", a.provider(), true));
				default -> {
				}
			}
		}
		for (NotificationLog.Sent n : notifications.forOrder(order.id())) {
			events.add(new TimelineEvent(n.at(),
					(n.channel().equals("sms") ? "SMS: " : "E-posta: ") + kindLabel(n.kind()) + ", "
							+ (n.delivered() ? "iletildi" : "iletilemedi"),
					n.delivered() ? "Sistem"
							: "Sağlayıcı yanıtı: " + (n.providerResponse() == null ? "bilinmiyor"
									: n.providerResponse().toLowerCase(TR)),
					!n.delivered()));
		}
		events.sort(Comparator.comparing(TimelineEvent::at));
		return events;
	}

	private static NotificationView notificationView(NotificationLog.Sent n) {
		String text = kindLabel(n.kind());
		text = text.substring(0, 1).toUpperCase(TR) + text.substring(1)
				+ (n.orderNumber() == null ? "" : ", " + n.orderNumber());
		String recipient = n.recipient().matches(".*\\d.*") ? Masks.phone(n.recipient()) : n.recipient();
		return new NotificationView(n.id(), n.shopId(), n.orderNumber(), n.channel(), text, recipient, n.delivered(),
				n.providerResponse(), n.at());
	}

	private static String kindLabel(String kind) {
		return switch (kind) {
			case "order_confirmed" -> "sipariş onayı";
			case "order_on_way" -> "sipariş yolda";
			case "order_delivered" -> "teslim edildi";
			case "order_failed" -> "teslim edilemedi";
			case "new_order_email" -> "yeni sipariş";
			case "impersonation_email" -> "destek ekibi panelinize girdi";
			case "daily_summary" -> "günün siparişleri özeti";
			default -> kind;
		};
	}

	private static String statusText(OrderStatus status) {
		return switch (status) {
			case PREPARING -> "Hazırlanıyor olarak işaretlendi";
			case ON_WAY -> "Yola çıktı";
			case DELIVERED -> "Teslim edildi";
			case FAILED -> "Teslim edilemedi";
			case CANCELLED -> "İptal edildi";
			case NEW -> "Sipariş alındı";
		};
	}

	private static String actor(Order.Event e, String owner) {
		return e.actor() == null ? owner + ", dükkân" : e.actor();
	}

	private Map<String, String> shopNames() {
		Map<String, String> names = new LinkedHashMap<>();
		shops.all().forEach(s -> names.put(s.id(), s.name()));
		return names;
	}

	/** Paket SMS sayısı (docs/mvp.md "Fiyatlandırma"). */
	private static int smsLimit(ShopPlan plan) {
		return plan == ShopPlan.STARTER ? 100 : 500;
	}

	private static String district(String address) {
		String[] parts = address.split(",");
		return parts[parts.length - 1].strip();
	}
}
