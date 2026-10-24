package com.tomurcuk.ordering.internal;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Time;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import com.tomurcuk.ordering.Order;
import com.tomurcuk.shared.Instants;
import com.tomurcuk.ordering.OrderSource;
import com.tomurcuk.ordering.OrderStatus;
import com.tomurcuk.ordering.PaymentMethod;
import com.tomurcuk.ordering.PaymentStatus;
import com.tomurcuk.shared.ClockTimes;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;
import tools.jackson.databind.json.JsonMapper;

/** Dükkâna ait her sorgu `shop_id` ile sınırlıdır; başka dükkânın kaydı bulunamaz. */
@Repository
public class OrderStore {

	private final JdbcClient jdbc;

	private final JsonMapper json;

	OrderStore(JdbcClient jdbc, JsonMapper json) {
		this.jdbc = jdbc;
		this.json = json;
	}

	/** Dükkânın bir sonraki sipariş numarası; sayaç satırı yoksa 1000'den başlar. */
	int nextNumber(String shopId) {
		jdbc.sql("INSERT INTO shop_order_counter (shop_id, next_number) VALUES (:shopId, 1000) ON CONFLICT DO NOTHING")
			.param("shopId", shopId)
			.update();
		return jdbc
			.sql("UPDATE shop_order_counter SET next_number = next_number + 1 WHERE shop_id = :shopId RETURNING next_number - 1")
			.param("shopId", shopId)
			.query(Integer.class)
			.single();
	}

	void insert(Order order, String idempotencyKey) {
		insert(order, idempotencyKey, null);
	}

	/** `termsVersion`: alıcının onayladığı sözleşmelerin sürümü; panelden girilen siparişte yok. */
	void insert(Order order, String idempotencyKey, String termsVersion) {
		jdbc.sql("""
				INSERT INTO orders (id, shop_id, number, customer_id, source, status, payment_status, payment_method,
				                    delivery_date, time_slot_id, slot_start, slot_end, delivery_time, exact_time,
				                    delivery_zone_id, zone_name, recipient_name, recipient_phone, address, courier_note,
				                    card_note, sender_name, anonymous, sender_phone, subtotal, delivery_fee, total,
				                    delivery_photo_url, courier_name, tracking_token, idempotency_key, created_at,
				                    terms_version)
				VALUES (:id, :shopId, :number, :customerId, :source, :status, :paymentStatus, :paymentMethod,
				        :deliveryDate, :timeSlotId, :slotStart, :slotEnd, :deliveryTime, :exactTime,
				        :deliveryZoneId, :zoneName, :recipientName, :recipientPhone, :address, :courierNote,
				        :cardNote, :senderName, :anonymous, :senderPhone, :subtotal, :deliveryFee, :total,
				        :deliveryPhotoUrl, :courierName, :trackingToken, :idempotencyKey, :createdAt,
				        :termsVersion)
				""")
			.param("id", order.id())
			.param("shopId", order.shopId())
			.param("number", order.number())
			.param("customerId", order.customerId())
			.param("source", order.source().code())
			.param("status", order.status().code())
			.param("paymentStatus", order.paymentStatus().code())
			.param("paymentMethod", order.paymentMethod().code())
			.param("deliveryDate", order.deliveryDate())
			.param("timeSlotId", order.timeSlotId())
			.param("slotStart", LocalTime.parse(order.slotStart()))
			.param("slotEnd", LocalTime.parse(order.slotEnd()))
			.param("deliveryTime", order.deliveryTime() == null ? null : LocalTime.parse(order.deliveryTime()))
			.param("exactTime", order.exactTime())
			.param("deliveryZoneId", order.deliveryZoneId())
			.param("zoneName", order.zoneName())
			.param("recipientName", order.recipientName())
			.param("recipientPhone", order.recipientPhone())
			.param("address", order.address())
			.param("courierNote", order.courierNote())
			.param("cardNote", order.cardNote())
			.param("senderName", order.senderName())
			.param("anonymous", order.anonymous())
			.param("senderPhone", order.senderPhone())
			.param("subtotal", order.subtotal())
			.param("deliveryFee", order.deliveryFee())
			.param("total", order.total())
			.param("deliveryPhotoUrl", order.deliveryPhotoUrl())
			.param("courierName", order.courierName())
			.param("trackingToken", order.trackingToken())
			.param("idempotencyKey", idempotencyKey)
			.param("createdAt", Instants.sql(order.createdAt()))
			.param("termsVersion", termsVersion)
			.update();
		int position = 1;
		for (Order.Item item : order.items()) {
			jdbc.sql("""
					INSERT INTO order_item (id, order_id, product_id, product_name, unit_price, quantity, options, position)
					VALUES (:id, :orderId, :productId, :productName, :unitPrice, :quantity, CAST(:options AS jsonb), :position)
					""")
				.param("id", item.id())
				.param("orderId", order.id())
				.param("productId", item.productId())
				.param("productName", item.productName())
				.param("unitPrice", item.unitPrice())
				.param("quantity", item.quantity())
				.param("options", json.writeValueAsString(item.options()))
				.param("position", position++)
				.update();
		}
		order.events().forEach(event -> addEvent(order.id(), event.status(), event.at(), null));
	}

	void addEvent(String orderId, OrderStatus status, Instant at, String actor) {
		jdbc.sql("INSERT INTO order_event (order_id, status, at, actor) VALUES (:orderId, :status, :at, :actor)")
			.param("orderId", orderId)
			.param("status", status.code())
			.param("at", Instants.sql(at))
			.param("actor", actor)
			.update();
	}

	Optional<Order> find(String shopId, String orderId) {
		return findWhere("o.shop_id = :shopId AND o.id = :value", shopId, orderId);
	}

	Optional<Order> findByTrackingToken(String shopId, String token) {
		return findWhere("o.shop_id = :shopId AND o.tracking_token = :value", shopId, token);
	}

	Optional<String> termsVersion(String orderId) {
		return jdbc.sql("SELECT terms_version FROM orders WHERE id = :id")
			.param("id", orderId)
			.query((rs, n) -> Optional.ofNullable(rs.getString(1)))
			.single();
	}

	Optional<Order> findByIdempotencyKey(String shopId, String key) {
		return findWhere("o.shop_id = :shopId AND o.idempotency_key = :value", shopId, key);
	}

	Optional<String> findTrackingToken(String shopId, String number, String senderPhone) {
		return jdbc.sql("""
				SELECT tracking_token FROM orders
				WHERE shop_id = :shopId AND number = :number AND sender_phone = :phone
				""")
			.param("shopId", shopId)
			.param("number", number)
			.param("phone", senderPhone)
			.query(String.class)
			.optional();
	}

	/** Bütün dükkânlarda; aynı numara ve telefon birden çok dükkânda varsa en yeni sipariş. */
	Optional<TrackingRef> findTrackingRef(String number, String senderPhone) {
		return jdbc.sql("""
				SELECT shop_id, tracking_token FROM orders
				WHERE number = :number AND sender_phone = :phone
				ORDER BY created_at DESC
				LIMIT 1
				""")
			.param("number", number)
			.param("phone", senderPhone)
			.query((rs, n) -> new TrackingRef(rs.getString("shop_id"), rs.getString("tracking_token")))
			.optional();
	}

	public record TrackingRef(String shopId, String token) {
	}

	/** Ödendi işaretler; zaten ödenmişse 0 döner. */
	int markPaid(String orderId) {
		return jdbc.sql("UPDATE orders SET payment_status = 'paid' WHERE id = :id AND payment_status <> 'paid'")
			.param("id", orderId)
			.update();
	}

	/** Kartla ödenmesi beklenip `before`'dan önce açılmış, hâlâ yeni siparişler. */
	List<String> findUnpaidCardOrders(Instant before) {
		return jdbc.sql("""
				SELECT id FROM orders
				WHERE payment_method = 'card' AND payment_status = 'pending' AND status = 'new' AND created_at < :before
				ORDER BY created_at
				LIMIT 100
				""")
			.param("before", Instants.sql(before))
			.query(String.class)
			.list();
	}

	/** Ödenmemiş kartlı siparişi iptal eder; bu arada ödendiyse ya da durumu değiştiyse 0 döner. */
	int cancelUnpaid(String orderId) {
		return jdbc.sql("""
				UPDATE orders SET status = 'cancelled', payment_status = 'unpaid'
				WHERE id = :id AND payment_method = 'card' AND payment_status = 'pending' AND status = 'new'
				""")
			.param("id", orderId)
			.update();
	}

	/** Teslim gününe göre; `from` ve `to` dahil, boşsa sınırsız. Gün ve aralık başlangıcına göre sıralı. */
	List<Order> findByDeliveryDate(String shopId, LocalDate from, LocalDate to) {
		return jdbc.sql("SELECT o.* FROM orders o WHERE o.shop_id = :shopId"
				+ (from == null ? "" : " AND o.delivery_date >= :from") + (to == null ? "" : " AND o.delivery_date <= :to")
				+ " ORDER BY o.delivery_date, o.slot_start, o.number")
			.param("shopId", shopId)
			.param("from", from)
			.param("to", to)
			.query(this::mapOrder)
			.list();
	}

	/** Müşterinin siparişleri, yeniden eskiye. */
	List<Order> findByCustomer(String shopId, String customerId) {
		return jdbc.sql("SELECT o.* FROM orders o WHERE o.shop_id = :shopId AND o.customer_id = :customerId ORDER BY o.created_at DESC")
			.param("shopId", shopId)
			.param("customerId", customerId)
			.query(this::mapOrder)
			.list();
	}

	/** İptal edilmemiş siparişlerden müşteri başına sayı, toplam ve son sipariş anı. */
	Map<String, CustomerTotals> customerTotals(String shopId) {
		Map<String, CustomerTotals> totals = new HashMap<>();
		jdbc.sql("""
				SELECT customer_id, count(*) AS order_count, sum(total) AS total_spent, max(created_at) AS last_order_at
				FROM orders WHERE shop_id = :shopId AND status <> 'cancelled'
				GROUP BY customer_id
				""")
			.param("shopId", shopId)
			.query((rs, n) -> totals.put(rs.getString("customer_id"), new CustomerTotals(rs.getInt("order_count"),
					rs.getLong("total_spent"), rs.getTimestamp("last_order_at").toInstant())))
			.list();
		return totals;
	}

	/**
	 * Durumu `from`'dan `to`'ya geçirir; bu arada başkası değiştirdiyse 0 döner. Teslimde teslim
	 * saati yazılır.
	 */
	int changeStatus(String shopId, String orderId, OrderStatus from, OrderStatus to, LocalTime deliveredAt) {
		return jdbc.sql("""
				UPDATE orders SET status = :to,
				       delivery_time = CASE WHEN :to = 'delivered' THEN CAST(:deliveredAt AS time) ELSE delivery_time END
				WHERE shop_id = :shopId AND id = :id AND status = :from
				""")
			.param("to", to.code())
			.param("deliveredAt", deliveredAt)
			.param("shopId", shopId)
			.param("id", orderId)
			.param("from", from.code())
			.update();
	}

	/** Bekleyen yeni siparişler (kartla ödemesi onaylanmamışlar hariç) ve en son geleni. */
	NewOrders newOrders(String shopId) {
		return jdbc.sql("""
				SELECT count(*) AS count,
				       (array_agg(id ORDER BY created_at DESC, id DESC))[1] AS latest_id,
				       (array_agg(number ORDER BY created_at DESC, id DESC))[1] AS latest_number
				FROM orders
				WHERE shop_id = :shopId AND status = 'new' AND NOT (payment_method = 'card' AND payment_status <> 'paid')
				""")
			.param("shopId", shopId)
			.query((rs, n) -> new NewOrders(rs.getInt("count"), rs.getString("latest_id"), rs.getString("latest_number")))
			.single();
	}

	int setDeliveryPhoto(String shopId, String orderId, String url) {
		return jdbc.sql("UPDATE orders SET delivery_photo_url = :url WHERE shop_id = :shopId AND id = :id")
			.param("url", url)
			.param("shopId", shopId)
			.param("id", orderId)
			.update();
	}

	int markPaid(String shopId, String orderId) {
		return jdbc.sql("UPDATE orders SET payment_status = 'paid' WHERE shop_id = :shopId AND id = :id AND payment_status <> 'paid'")
			.param("shopId", shopId)
			.param("id", orderId)
			.update();
	}

	record CustomerTotals(int orderCount, long totalSpent, Instant lastOrderAt) {
	}

	/**
	 * Destek araması: sipariş numarası, alıcı adı ya da (en az 4 haneyle) alıcı veya gönderen
	 * telefonu. Bütün dükkânlarda; yalnızca destek uçları çağırır.
	 */
	public List<Order> search(String text, String digits, int limit) {
		return jdbc.sql("""
				SELECT o.* FROM orders o
				WHERE lower(o.number) LIKE :text OR lower(o.recipient_name) LIKE :text
				   OR (length(:digits) >= 4 AND (regexp_replace(o.recipient_phone, '\\D', '', 'g') LIKE :digitsLike
				                              OR regexp_replace(o.sender_phone, '\\D', '', 'g') LIKE :digitsLike))
				ORDER BY o.delivery_date DESC, o.created_at DESC
				LIMIT :limit
				""")
			.param("text", "%" + text + "%")
			.param("digits", digits)
			.param("digitsLike", "%" + digits + "%")
			.param("limit", limit)
			.query(this::mapOrder)
			.list();
	}

	/** Destek sipariş listesi: dünden itibaren teslim edilecekler ve henüz kapanmamışlar. */
	public List<Order> openOrUpcoming(LocalDate since, int limit) {
		return jdbc.sql("""
				SELECT o.* FROM orders o
				WHERE o.delivery_date >= :since OR o.status IN ('new', 'preparing', 'onway', 'failed')
				ORDER BY o.delivery_date, o.slot_start, o.number
				LIMIT :limit
				""")
			.param("since", since)
			.param("limit", limit)
			.query(this::mapOrder)
			.list();
	}

	/** Dükkânın son siparişleri, teslim gününe göre yeniden eskiye. */
	public List<Order> recent(String shopId, int limit) {
		return jdbc.sql("SELECT o.* FROM orders o WHERE o.shop_id = :shopId ORDER BY o.delivery_date DESC, o.created_at DESC LIMIT :limit")
			.param("shopId", shopId)
			.param("limit", limit)
			.query(this::mapOrder)
			.list();
	}

	public Optional<Order> findByNumber(String shopId, String number) {
		return findWhere("o.shop_id = :shopId AND o.number = :value", shopId, number);
	}

	/** `since`'ten bu yana açılan, iptal edilmemiş sipariş sayısı. */
	public int countSince(String shopId, java.time.Instant since) {
		return jdbc.sql("SELECT count(*) FROM orders WHERE shop_id = :shopId AND created_at >= :since AND status <> 'cancelled'")
			.param("shopId", shopId)
			.param("since", Instants.sql(since))
			.query(Integer.class)
			.single();
	}

	public Optional<Order> findById(String orderId) {
		return jdbc.sql("SELECT shop_id FROM orders WHERE id = :id")
			.param("id", orderId)
			.query(String.class)
			.optional()
			.flatMap(shopId -> find(shopId, orderId));
	}

	private Optional<Order> findWhere(String condition, String shopId, String value) {
		return jdbc.sql("SELECT o.* FROM orders o WHERE " + condition)
			.param("shopId", shopId)
			.param("value", value)
			.query(this::mapOrder)
			.optional();
	}

	private Order mapOrder(ResultSet rs, int row) throws SQLException {
		String id = rs.getString("id");
		List<Order.Item> items = jdbc.sql("SELECT * FROM order_item WHERE order_id = :id ORDER BY position")
			.param("id", id)
			.query((r, n) -> new Order.Item(r.getString("id"), id, r.getString("product_id"),
					r.getString("product_name"), r.getLong("unit_price"), r.getInt("quantity"),
					json.readValue(r.getString("options"), json.getTypeFactory()
						.constructCollectionType(List.class, Order.ItemOption.class))))
			.list();
		List<Order.Event> events = jdbc.sql("SELECT status, at, actor FROM order_event WHERE order_id = :id ORDER BY at, id")
			.param("id", id)
			.query((r, n) -> new Order.Event(OrderStatus.fromCode(r.getString("status")),
					r.getTimestamp("at").toInstant(), r.getString("actor")))
			.list();
		return new Order(id, rs.getString("number"), rs.getString("shop_id"), rs.getString("customer_id"),
				OrderSource.fromCode(rs.getString("source")), OrderStatus.fromCode(rs.getString("status")),
				PaymentStatus.fromCode(rs.getString("payment_status")),
				PaymentMethod.fromCode(rs.getString("payment_method")), rs.getObject("delivery_date", LocalDate.class),
				rs.getString("time_slot_id"), time(rs.getTime("slot_start")), time(rs.getTime("slot_end")),
				time(rs.getTime("delivery_time")), rs.getBoolean("exact_time"), rs.getString("delivery_zone_id"),
				rs.getString("zone_name"), rs.getString("recipient_name"), rs.getString("recipient_phone"),
				rs.getString("address"), rs.getString("courier_note"), rs.getString("card_note"),
				rs.getString("sender_name"), rs.getBoolean("anonymous"), items, rs.getLong("subtotal"),
				rs.getLong("delivery_fee"), rs.getLong("total"), rs.getString("delivery_photo_url"),
				rs.getTimestamp("created_at").toInstant(), rs.getString("tracking_token"),
				rs.getString("sender_phone"), rs.getString("courier_name"), events);
	}

	private static String time(Time time) {
		return time == null ? null : ClockTimes.format(time.toLocalTime());
	}
}
