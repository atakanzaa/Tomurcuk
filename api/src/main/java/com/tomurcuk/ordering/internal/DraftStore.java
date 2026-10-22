package com.tomurcuk.ordering.internal;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.Clock;
import java.util.Optional;

import com.tomurcuk.shared.Instants;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;
import tools.jackson.databind.json.JsonMapper;

@Repository
class DraftStore {

	private static final String COLUMNS = """
			id, shop_id, product_id, product_name, unit_price, options, line_total, delivery, card, order_id,
			expires_at""";

	private final JdbcClient jdbc;

	private final JsonMapper json;

	private final Clock clock;

	DraftStore(JdbcClient jdbc, JsonMapper json, Clock clock) {
		this.jdbc = jdbc;
		this.json = json;
		this.clock = clock;
	}

	void insert(Draft draft) {
		jdbc.sql("""
				INSERT INTO order_draft (id, shop_id, product_id, product_name, unit_price, options, line_total,
				                         expires_at)
				VALUES (:id, :shopId, :productId, :productName, :unitPrice, CAST(:options AS jsonb), :lineTotal,
				        :expiresAt)
				""")
			.param("id", draft.id())
			.param("shopId", draft.shopId())
			.param("productId", draft.item().productId())
			.param("productName", draft.item().productName())
			.param("unitPrice", draft.item().unitPrice())
			.param("options", json.writeValueAsString(draft.item().options()))
			.param("lineTotal", draft.item().lineTotal())
			.param("expiresAt", Instants.sql(draft.expiresAt()))
			.update();
	}

	void update(Draft draft) {
		jdbc.sql("""
				UPDATE order_draft
				SET product_name = :productName, unit_price = :unitPrice, options = CAST(:options AS jsonb),
				    line_total = :lineTotal, delivery = CAST(:delivery AS jsonb), card = CAST(:card AS jsonb),
				    order_id = :orderId
				WHERE id = :id
				""")
			.param("productName", draft.item().productName())
			.param("unitPrice", draft.item().unitPrice())
			.param("options", json.writeValueAsString(draft.item().options()))
			.param("lineTotal", draft.item().lineTotal())
			.param("delivery", draft.delivery() == null ? null : json.writeValueAsString(draft.delivery()))
			.param("card", draft.card() == null ? null : json.writeValueAsString(draft.card()))
			.param("orderId", draft.orderId())
			.param("id", draft.id())
			.update();
	}

	/** Süresi dolmamış ve dükkâna ait taslak. `forUpdate` aynı taslağa eşzamanlı yazmayı sıraya sokar. */
	Optional<Draft> findLive(String shopId, String draftId, boolean forUpdate) {
		return jdbc.sql("SELECT " + COLUMNS + " FROM order_draft WHERE id = :id AND shop_id = :shopId AND expires_at > :now"
				+ (forUpdate ? " FOR UPDATE" : ""))
			.param("id", draftId)
			.param("shopId", shopId)
			.param("now", Instants.sql(clock.instant()))
			.query(this::map)
			.optional();
	}

	int deleteExpired() {
		return jdbc.sql("DELETE FROM order_draft WHERE expires_at < :now").param("now", Instants.sql(clock.instant())).update();
	}

	private Draft map(ResultSet rs, int row) throws SQLException {
		Draft.Item item = new Draft.Item(rs.getString("product_id"), rs.getString("product_name"),
				rs.getLong("unit_price"),
				json.readValue(rs.getString("options"),
						json.getTypeFactory().constructCollectionType(java.util.List.class, Draft.Option.class)),
				rs.getLong("line_total"));
		String delivery = rs.getString("delivery");
		String card = rs.getString("card");
		return new Draft(rs.getString("id"), rs.getString("shop_id"), item,
				delivery == null ? null : json.readValue(delivery, Draft.Delivery.class),
				card == null ? null : json.readValue(card, Draft.Card.class), 0, 0, 0, rs.getString("order_id"),
				rs.getTimestamp("expires_at").toInstant())
			.withTotals();
	}
}
