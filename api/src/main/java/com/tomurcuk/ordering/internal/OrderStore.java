package com.tomurcuk.ordering.internal;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Time;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

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
class OrderStore {

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
		jdbc.sql("""
				INSERT INTO orders (id, shop_id, number, customer_id, source, status, payment_status, payment_method,
				                    delivery_date, time_slot_id, slot_start, slot_end, delivery_time, exact_time,
				                    delivery_zone_id, zone_name, recipient_name, recipient_phone, address, courier_note,
				                    card_note, sender_name, anonymous, sender_phone, subtotal, delivery_fee, total,
				                    delivery_photo_url, courier_name, tracking_token, idempotency_key, created_at)
				VALUES (:id, :shopId, :number, :customerId, :source, :status, :paymentStatus, :paymentMethod,
				        :deliveryDate, :timeSlotId, :slotStart, :slotEnd, :deliveryTime, :exactTime,
				        :deliveryZoneId, :zoneName, :recipientName, :recipientPhone, :address, :courierNote,
				        :cardNote, :senderName, :anonymous, :senderPhone, :subtotal, :deliveryFee, :total,
				        :deliveryPhotoUrl, :courierName, :trackingToken, :idempotencyKey, :createdAt)
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

	Optional<Order> findById(String orderId) {
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
		List<Order.Event> events = jdbc.sql("SELECT status, at FROM order_event WHERE order_id = :id ORDER BY at, id")
			.param("id", id)
			.query((r, n) -> new Order.Event(OrderStatus.fromCode(r.getString("status")),
					r.getTimestamp("at").toInstant()))
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
