package com.tomurcuk.demo;

import java.io.IOException;
import java.io.InputStream;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;

import com.tomurcuk.shared.Instants;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

/**
 * Tasarımlardaki örnek siparişler ve özel günler (web/lib/mock/data.ts). Her açılışta silinip yeniden yüklenir;
 * tarihler tasarımın taban gününden (22 Ekim) gerçek bugüne kaydırılır. Böylece "Bugün"
 * ekranı ve takip linkleri her gün dolu görünür. Yalnızca `demo` profilinde çalışır.
 */
@Component
@Profile("demo")
class DemoOrders implements ApplicationRunner {

	private static final ZoneId ISTANBUL = ZoneId.of("Europe/Istanbul");

	private final JdbcClient jdbc;

	private final JsonMapper json;

	private final Clock clock;

	DemoOrders(JdbcClient jdbc, JsonMapper json, Clock clock) {
		this.jdbc = jdbc;
		this.json = json;
		this.clock = clock;
	}

	@Override
	@Transactional
	public void run(ApplicationArguments args) throws IOException {
		JsonNode fixture;
		try (InputStream in = new ClassPathResource("demo/orders.json").getInputStream()) {
			fixture = json.readTree(in);
		}
		LocalDate today = LocalDate.now(clock.withZone(ISTANBUL));
		long shift = ChronoUnit.DAYS.between(LocalDate.parse(fixture.get("baseDate").asString()), today);
		String shopId = fixture.get("shopId").asString();

		List<String> ids = new ArrayList<>();
		fixture.get("orders").forEach(order -> ids.add(order.get("id").asString()));
		jdbc.sql("DELETE FROM orders WHERE id IN (:ids)").param("ids", ids).update();
		fixture.get("orders").forEach(order -> insert(order, shift));

		// Özel günler taban güne göre (2, 4, 6 gün sonra); hatırlatma listesi her gün dolu görünür.
		LocalDate baseDate = LocalDate.parse(fixture.get("baseDate").asString());
		for (JsonNode day : fixture.get("specialDays")) {
			LocalDate date = baseDate.plusDays(day.get("dayOffset").asLong() + shift);
			jdbc.sql("""
					INSERT INTO special_day (id, customer_id, title, day, month, recipient_name)
					VALUES (:id, :customerId, :title, :day, :month, :recipientName)
					ON CONFLICT (id) DO UPDATE SET day = EXCLUDED.day, month = EXCLUDED.month, title = EXCLUDED.title,
					    recipient_name = EXCLUDED.recipient_name
					""")
				.param("id", text(day, "id"))
				.param("customerId", text(day, "customerId"))
				.param("title", text(day, "title"))
				.param("day", date.getDayOfMonth())
				.param("month", date.getMonthValue())
				.param("recipientName", text(day, "recipientName"))
				.update();
		}

		jdbc.sql("""
				INSERT INTO shop_order_counter (shop_id, next_number) VALUES (:shopId, :next)
				ON CONFLICT (shop_id) DO UPDATE SET next_number = GREATEST(shop_order_counter.next_number, :next)
				""")
			.param("shopId", shopId)
			.param("next", fixture.get("nextNumber").asInt())
			.update();

		// Tasarımdaki teslimat ekranı: sabah dolu, öğle 3 yer, akşam müsait. Gün içinde verilen
		// gerçek siparişler sayılmaya devam etsin diye yalnızca günün ilk açılışında yazılır.
		fixture.get("remainingToday").properties().forEach(entry -> jdbc.sql("""
				INSERT INTO slot_capacity (shop_id, date, slot_id, capacity, taken)
				SELECT shop_id, :date, id, capacity, GREATEST(capacity - :remaining, 0)
				FROM time_slot WHERE id = :slotId
				ON CONFLICT DO NOTHING
				""")
			.param("date", today)
			.param("slotId", entry.getKey())
			.param("remaining", entry.getValue().asInt())
			.update());
	}

	private void insert(JsonNode o, long shift) {
		String id = o.get("id").asString();
		jdbc.sql("""
				INSERT INTO orders (id, shop_id, number, customer_id, source, status, payment_status, payment_method,
				                    delivery_date, time_slot_id, slot_start, slot_end, delivery_time, exact_time,
				                    delivery_zone_id, zone_name, recipient_name, recipient_phone, address, courier_note,
				                    card_note, sender_name, anonymous, sender_phone, subtotal, delivery_fee, total,
				                    delivery_photo_url, courier_name, tracking_token, created_at)
				VALUES (:id, :shopId, :number, :customerId, :source, :status, :paymentStatus, :paymentMethod,
				        :deliveryDate, :timeSlotId, :slotStart, :slotEnd, :deliveryTime, :exactTime,
				        :deliveryZoneId, :zoneName, :recipientName, :recipientPhone, :address, :courierNote,
				        :cardNote, :senderName, :anonymous, :senderPhone, :subtotal, :deliveryFee, :total,
				        :deliveryPhotoUrl, :courierName, :trackingToken, :createdAt)
				""")
			.param("id", id)
			.param("shopId", text(o, "shopId"))
			.param("number", text(o, "number"))
			.param("customerId", text(o, "customerId"))
			.param("source", text(o, "source"))
			.param("status", text(o, "status"))
			.param("paymentStatus", text(o, "paymentStatus"))
			.param("paymentMethod", text(o, "paymentMethod"))
			.param("deliveryDate", LocalDate.parse(text(o, "deliveryDate")).plusDays(shift))
			.param("timeSlotId", text(o, "timeSlotId"))
			.param("slotStart", LocalTime.parse(text(o, "slotStart")))
			.param("slotEnd", LocalTime.parse(text(o, "slotEnd")))
			.param("deliveryTime", text(o, "deliveryTime") == null ? null : LocalTime.parse(text(o, "deliveryTime")))
			.param("exactTime", o.get("exactTime").asBoolean())
			.param("deliveryZoneId", text(o, "deliveryZoneId"))
			.param("zoneName", str(o, "zoneName"))
			.param("recipientName", str(o, "recipientName"))
			.param("recipientPhone", str(o, "recipientPhone"))
			.param("address", str(o, "address"))
			.param("courierNote", text(o, "courierNote"))
			.param("cardNote", text(o, "cardNote"))
			.param("senderName", text(o, "senderName"))
			.param("anonymous", o.get("anonymous").asBoolean())
			.param("senderPhone", str(o, "senderPhone"))
			.param("subtotal", o.get("subtotal").asLong())
			.param("deliveryFee", o.get("deliveryFee").asLong())
			.param("total", o.get("total").asLong())
			.param("deliveryPhotoUrl", text(o, "deliveryPhotoUrl"))
			.param("courierName", text(o, "courierName"))
			.param("trackingToken", text(o, "trackingToken"))
			.param("createdAt", Instants.sql(shifted(text(o, "createdAt"), shift)))
			.update();
		int position = 1;
		for (JsonNode item : o.get("items")) {
			jdbc.sql("""
					INSERT INTO order_item (id, order_id, product_id, product_name, unit_price, quantity, options, position)
					VALUES (:id, :orderId, :productId, :productName, :unitPrice, :quantity, CAST(:options AS jsonb), :position)
					""")
				.param("id", text(item, "id"))
				.param("orderId", id)
				.param("productId", text(item, "productId"))
				.param("productName", text(item, "productName"))
				.param("unitPrice", item.get("unitPrice").asLong())
				.param("quantity", item.get("quantity").asInt())
				.param("options", json.writeValueAsString(item.get("options")))
				.param("position", position++)
				.update();
		}
		for (JsonNode event : o.get("events")) {
			jdbc.sql("INSERT INTO order_event (order_id, status, at) VALUES (:orderId, :status, :at)")
				.param("orderId", id)
				.param("status", text(event, "status"))
				.param("at", Instants.sql(shifted(text(event, "at"), shift)))
				.update();
		}
	}

	private static Instant shifted(String iso, long days) {
		return Instant.parse(iso).plus(days, ChronoUnit.DAYS);
	}

	/** Zorunlu sütunlar: geçmiş siparişlerde boş metin olarak kalır. */
	private static String str(JsonNode node, String field) {
		return node.get(field).asString();
	}

	/** Boş metin ve null aynı sayılır (geçmiş siparişlerde ürün id'si yoktur). */
	private static String text(JsonNode node, String field) {
		JsonNode value = node.get(field);
		if (value == null || value.isNull()) {
			return null;
		}
		String text = value.asString();
		return text.isEmpty() ? null : text;
	}
}
