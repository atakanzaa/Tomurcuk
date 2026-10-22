package com.tomurcuk.support.internal;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

import com.tomurcuk.shared.Instants;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

@Repository
class TicketStore {

	private final JdbcClient jdbc;

	TicketStore(JdbcClient jdbc) {
		this.jdbc = jdbc;
	}

	List<Ticket> all() {
		return jdbc.sql("SELECT * FROM support_ticket").query(this::map).list();
	}

	List<Ticket> ofShop(String shopId) {
		return jdbc.sql("SELECT * FROM support_ticket WHERE shop_id = :shopId ORDER BY created_at DESC")
			.param("shopId", shopId)
			.query(this::map)
			.list();
	}

	Optional<Ticket> find(String id) {
		return jdbc.sql("SELECT * FROM support_ticket WHERE id = :id").param("id", id).query(this::map).optional();
	}

	List<Views.TicketMessage> messages(String ticketId) {
		return jdbc.sql("SELECT * FROM ticket_message WHERE ticket_id = :id ORDER BY at, id")
			.param("id", ticketId)
			.query((rs, n) -> new Views.TicketMessage(rs.getString("id"), rs.getString("author_name"),
					rs.getString("author_org"), rs.getBoolean("internal"), rs.getString("text"),
					rs.getTimestamp("at").toInstant()))
			.list();
	}

	void insert(Ticket t) {
		jdbc.sql("""
				INSERT INTO support_ticket (id, shop_id, order_id, order_number, subject, category, priority, status,
				                            assignee_id, created_at, waiting_since, first_response_at)
				VALUES (:id, :shopId, :orderId, :orderNumber, :subject, :category, :priority, :status, :assigneeId,
				        :createdAt, :waitingSince, :firstResponseAt)
				""")
			.param("id", t.id())
			.param("shopId", t.shopId())
			.param("orderId", t.orderId())
			.param("orderNumber", t.orderNumber())
			.param("subject", t.subject())
			.param("category", t.category())
			.param("priority", t.priority())
			.param("status", t.status())
			.param("assigneeId", t.assigneeId())
			.param("createdAt", Instants.sql(t.createdAt()))
			.param("waitingSince", Instants.sql(t.waitingSince()))
			.param("firstResponseAt", Instants.sql(t.firstResponseAt()))
			.update();
	}

	void addMessage(String id, String ticketId, String authorType, String authorId, String authorName,
			String authorOrg, boolean internal, String text, Instant at) {
		jdbc.sql("""
				INSERT INTO ticket_message (id, ticket_id, author_type, author_id, author_name, author_org, internal, text, at)
				VALUES (:id, :ticketId, :authorType, :authorId, :authorName, :authorOrg, :internal, :text, :at)
				""")
			.param("id", id)
			.param("ticketId", ticketId)
			.param("authorType", authorType)
			.param("authorId", authorId)
			.param("authorName", authorName)
			.param("authorOrg", authorOrg)
			.param("internal", internal)
			.param("text", text)
			.param("at", Instants.sql(at))
			.update();
	}

	/** Dükkâna giden yanıttan sonra: ilk yanıt zamanı ve atanan kişi boşsa dolar, bekleme yeniden başlar. */
	void markReplied(String ticketId, String userId, String status, Instant at) {
		jdbc.sql("""
				UPDATE support_ticket
				SET first_response_at = coalesce(first_response_at, :at), assignee_id = coalesce(assignee_id, :userId),
				    status = :status, waiting_since = :at
				WHERE id = :id
				""")
			.param("at", Instants.sql(at))
			.param("userId", userId)
			.param("status", status)
			.param("id", ticketId)
			.update();
	}

	void assign(String ticketId, String userId) {
		jdbc.sql("UPDATE support_ticket SET assignee_id = :userId WHERE id = :id")
			.param("userId", userId)
			.param("id", ticketId)
			.update();
	}

	List<Views.CannedReply> cannedReplies() {
		return jdbc.sql("SELECT id, title, text, category FROM canned_reply ORDER BY id")
			.query(Views.CannedReply.class)
			.list();
	}

	List<Views.Note> notes(String shopId) {
		return jdbc.sql("SELECT id, shop_id, author_name, text, at FROM shop_note WHERE shop_id = :shopId ORDER BY at DESC")
			.param("shopId", shopId)
			.query((rs, n) -> new Views.Note(rs.getString("id"), rs.getString("shop_id"), rs.getString("author_name"),
					rs.getString("text"), rs.getTimestamp("at").toInstant()))
			.list();
	}

	void addNote(String id, String shopId, String authorId, String authorName, String text, Instant at) {
		jdbc.sql("INSERT INTO shop_note (id, shop_id, author_id, author_name, text, at) VALUES (:id, :shopId, :authorId, :authorName, :text, :at)")
			.param("id", id)
			.param("shopId", shopId)
			.param("authorId", authorId)
			.param("authorName", authorName)
			.param("text", text)
			.param("at", Instants.sql(at))
			.update();
	}

	private Ticket map(ResultSet rs, int row) throws SQLException {
		return new Ticket(rs.getString("id"), rs.getString("shop_id"), rs.getString("order_id"),
				rs.getString("order_number"), rs.getString("subject"), rs.getString("category"),
				rs.getString("priority"), rs.getString("status"), rs.getString("assignee_id"),
				rs.getTimestamp("created_at").toInstant(), rs.getTimestamp("waiting_since").toInstant(),
				rs.getTimestamp("first_response_at") == null ? null : rs.getTimestamp("first_response_at").toInstant());
	}

	record Ticket(String id, String shopId, String orderId, String orderNumber, String subject, String category,
			String priority, String status, String assigneeId, Instant createdAt, Instant waitingSince,
			Instant firstResponseAt) {
	}
}
