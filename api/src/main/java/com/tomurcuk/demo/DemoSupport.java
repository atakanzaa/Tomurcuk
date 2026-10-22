package com.tomurcuk.demo;

import java.io.IOException;
import java.io.InputStream;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;

import com.tomurcuk.shared.Instants;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

/**
 * Destek paneli tasarımlarındaki örnekler (web/lib/mock/support-data.ts): talepler, ekip
 * notları, bildirimler ve denetim kayıtları. Zamanlar "şimdiden kaç dakika önce" olarak
 * tutulur; her açılışta yeniden yüklenir. Denetim kaydı silinemediği için örnekleri yalnızca
 * ilk açılışta eklenir. Örnek siparişlerden sonra çalışır (DemoOrders).
 */
@Component
@Profile("demo")
@Order(2)
class DemoSupport implements ApplicationRunner {

	private static final ZoneId ISTANBUL = ZoneId.of("Europe/Istanbul");

	private final JdbcClient jdbc;

	private final JsonMapper json;

	private final Clock clock;

	DemoSupport(JdbcClient jdbc, JsonMapper json, Clock clock) {
		this.jdbc = jdbc;
		this.json = json;
		this.clock = clock;
	}

	@Override
	@Transactional
	public void run(ApplicationArguments args) throws IOException {
		JsonNode fixture;
		try (InputStream in = new ClassPathResource("demo/support.json").getInputStream()) {
			fixture = json.readTree(in);
		}
		Instant now = clock.instant();
		LocalDate today = LocalDate.now(clock.withZone(ISTANBUL));

		List<String> ticketIds = new ArrayList<>();
		fixture.get("tickets").forEach(t -> ticketIds.add(t.get("id").asString()));
		jdbc.sql("DELETE FROM support_ticket WHERE id IN (:ids)").param("ids", ticketIds).update();
		for (JsonNode t : fixture.get("tickets")) {
			String id = t.get("id").asString();
			jdbc.sql("""
					INSERT INTO support_ticket (id, shop_id, order_id, order_number, subject, category, priority, status,
					                            assignee_id, created_at, waiting_since, first_response_at)
					VALUES (:id, :shopId, :orderId, :orderNumber, :subject, :category, :priority, :status, :assigneeId,
					        :createdAt, :waitingSince, :firstResponseAt)
					""")
				.param("id", id)
				.param("shopId", text(t, "shopId"))
				.param("orderId", text(t, "orderId"))
				.param("orderNumber", text(t, "orderNumber"))
				.param("subject", text(t, "subject"))
				.param("category", text(t, "category"))
				.param("priority", text(t, "priority"))
				.param("status", text(t, "status"))
				.param("assigneeId", text(t, "assigneeId"))
				.param("createdAt", Instants.sql(minutesAgo(now, t.get("createdMinutesAgo"))))
				.param("waitingSince", Instants.sql(minutesAgo(now, t.get("waitingMinutesAgo"))))
				.param("firstResponseAt", Instants.sql(minutesAgo(now, t.get("firstResponseMinutesAgo"))))
				.update();
			int i = 1;
			for (JsonNode m : t.get("messages")) {
				boolean platform = m.get("org").asString().equals("Tomurcuk Destek") || m.get("internal").asBoolean();
				jdbc.sql("""
						INSERT INTO ticket_message (id, ticket_id, author_type, author_name, author_org, internal, text, at)
						VALUES (:id, :ticketId, :authorType, :authorName, :authorOrg, :internal, :text, :at)
						""")
					.param("id", id + "_m" + i++)
					.param("ticketId", id)
					.param("authorType", platform ? "platform" : "shop")
					.param("authorName", text(m, "author"))
					.param("authorOrg", text(m, "org"))
					.param("internal", m.get("internal").asBoolean())
					.param("text", text(m, "text"))
					.param("at", Instants.sql(minutesAgo(now, m.get("minutesAgo"))))
					.update();
			}
		}

		List<String> noteIds = new ArrayList<>();
		fixture.get("notes").forEach(n -> noteIds.add(n.get("id").asString()));
		jdbc.sql("DELETE FROM shop_note WHERE id IN (:ids)").param("ids", noteIds).update();
		for (JsonNode n : fixture.get("notes")) {
			jdbc.sql("INSERT INTO shop_note (id, shop_id, author_name, text, at) VALUES (:id, :shopId, :authorName, :text, :at)")
				.param("id", text(n, "id"))
				.param("shopId", text(n, "shopId"))
				.param("authorName", text(n, "authorName"))
				.param("text", text(n, "text"))
				.param("at", Instants.sql(today.plusDays(n.get("dayOffset").asLong()).atTime(11, 0).atZone(ISTANBUL).toInstant()))
				.update();
		}

		// Bildirimler örnek siparişlerin olaylarına göre: "yolda" SMS'i alıcıya ulaşmamış (tk_1187).
		jdbc.sql("DELETE FROM notification_log WHERE id LIKE 'demo_nl_%'").update();
		for (JsonNode n : fixture.get("notifications")) {
			Instant at = n.has("todayAt")
					? today.atTime(LocalTime.parse(n.get("todayAt").asString())).atZone(ISTANBUL).toInstant()
					: jdbc.sql("SELECT max(at) FROM order_event WHERE order_id = :orderId AND status = :status")
						.param("orderId", text(n, "orderId"))
						.param("status", text(n, "afterStatus"))
						.query((rs, row) -> rs.getTimestamp(1) == null ? now : rs.getTimestamp(1).toInstant())
						.single()
						.plusSeconds(60);
			boolean delivered = n.get("delivered").asBoolean();
			jdbc.sql("""
					INSERT INTO notification_log (id, shop_id, order_id, order_number, kind, channel, recipient, text, status,
					                              attempts, provider_response, sent_at, created_at, dedupe_key)
					VALUES (:id, :shopId, :orderId, :orderNumber, :kind, :channel, :recipient, :text, :status, 1,
					        :response, :sentAt, :at, :id)
					""")
				.param("id", text(n, "id"))
				.param("shopId", text(n, "shopId"))
				.param("orderId", text(n, "orderId"))
				.param("orderNumber", text(n, "orderNumber"))
				.param("kind", text(n, "kind"))
				.param("channel", text(n, "channel"))
				.param("recipient", text(n, "recipient"))
				.param("text", text(n, "text"))
				.param("status", delivered ? "sent" : "failed")
				.param("response", text(n, "providerResponse"))
				.param("sentAt", delivered ? Instants.sql(at) : null)
				.param("at", Instants.sql(at))
				.update();
		}

		for (JsonNode a : fixture.get("audit")) {
			jdbc.sql("""
					INSERT INTO audit_log (id, actor_type, actor_id, actor_name, shop_id, action, record, reason, at)
					VALUES (:id, 'platform', :actorId, :actorName, :shopId, :action, :record, :reason, :at)
					ON CONFLICT (id) DO NOTHING
					""")
				.param("id", text(a, "id"))
				.param("actorId", text(a, "actorId"))
				.param("actorName", text(a, "actorName"))
				.param("shopId", text(a, "shopId"))
				.param("action", text(a, "action"))
				.param("record", text(a, "record"))
				.param("reason", text(a, "reason"))
				.param("at", Instants.sql(minutesAgo(now, a.get("minutesAgo"))))
				.update();
		}
	}

	private static Instant minutesAgo(Instant now, JsonNode minutes) {
		return minutes == null || minutes.isNull() ? null : now.minus(Duration.ofMinutes(minutes.asLong()));
	}

	private static String text(JsonNode node, String field) {
		JsonNode value = node.get(field);
		return value == null || value.isNull() ? null : value.asString();
	}
}
