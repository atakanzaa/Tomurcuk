package com.tomurcuk.review.internal;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import com.tomurcuk.review.Rating;
import com.tomurcuk.review.Review;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

/** `review` ve `review_product` tabloları. Yorumun ürünleri ayrı sorguyla tek seferde gelir. */
@Repository
public class ReviewStore {

	private static final String COLUMNS = """
			r.id, r.shop_id, r.order_number, r.rating, r.text, r.author_name, r.district, r.created_at,
			r.hidden_at, r.hidden_reason""";

	private final JdbcClient jdbc;

	ReviewStore(JdbcClient jdbc) {
		this.jdbc = jdbc;
	}

	public void insert(String orderId, Review review) {
		jdbc.sql("""
				INSERT INTO review (id, order_id, shop_id, order_number, rating, text, author_name, district, created_at)
				VALUES (:id, :orderId, :shopId, :number, :rating, :text, :author, :district, :createdAt)
				""")
			.param("id", review.id())
			.param("orderId", orderId)
			.param("shopId", review.shopId())
			.param("number", review.orderNumber())
			.param("rating", review.rating())
			.param("text", review.text())
			.param("author", review.authorName())
			.param("district", review.district())
			.param("createdAt", Timestamp.from(review.createdAt()))
			.update();
		for (Review.Product product : review.products()) {
			jdbc.sql("INSERT INTO review_product (review_id, product_id, product_name) VALUES (:id, :productId, :name)")
				.param("id", review.id())
				.param("productId", product.productId())
				.param("name", product.productName())
				.update();
		}
	}

	public Optional<Review> findByOrder(String orderId) {
		return withProducts(jdbc.sql("SELECT " + COLUMNS + " FROM review r WHERE r.order_id = :orderId")
			.param("orderId", orderId)
			.query(ReviewStore::map)
			.list()).stream().findFirst();
	}

	public Optional<Review> find(String id) {
		return withProducts(jdbc.sql("SELECT " + COLUMNS + " FROM review r WHERE r.id = :id")
			.param("id", id)
			.query(ReviewStore::map)
			.list()).stream().findFirst();
	}

	/** Gizlenenler dahil; panel ve destek için. */
	public List<Review> byShop(String shopId, int limit) {
		return withProducts(jdbc.sql("SELECT " + COLUMNS
				+ " FROM review r WHERE r.shop_id = :shopId ORDER BY r.created_at DESC, r.id DESC LIMIT :limit")
			.param("shopId", shopId)
			.param("limit", limit)
			.query(ReviewStore::map)
			.list());
	}

	public List<Review> visibleByProduct(String shopId, String productId, int limit) {
		return withProducts(jdbc.sql("SELECT " + COLUMNS + """
				 FROM review r JOIN review_product p ON p.review_id = r.id
				WHERE r.shop_id = :shopId AND p.product_id = :productId AND r.hidden_at IS NULL
				ORDER BY r.created_at DESC, r.id DESC LIMIT :limit
				""")
			.param("shopId", shopId)
			.param("productId", productId)
			.param("limit", limit)
			.query(ReviewStore::map)
			.list());
	}

	/**
	 * Metni olan en yeni görünür yorumlar, dükkânlar sırayla: önce her dükkânın en yenisi, sonra
	 * ikincisi. Böylece tek dükkân listeyi doldurmaz.
	 */
	public List<Review> recentAcrossShops(int limit) {
		return withProducts(jdbc.sql("SELECT " + COLUMNS + """
				 FROM (SELECT r.*, row_number() OVER (PARTITION BY r.shop_id ORDER BY r.created_at DESC, r.id DESC) AS rn
				      FROM review r WHERE r.hidden_at IS NULL AND r.text <> '') r
				ORDER BY r.rn, r.created_at DESC, r.id DESC LIMIT :limit
				""")
			.param("limit", limit)
			.query(ReviewStore::map)
			.list());
	}

	public Rating shopRating(String shopId) {
		return jdbc.sql("SELECT coalesce(sum(rating), 0) AS total, count(*) AS n FROM review WHERE shop_id = :shopId AND hidden_at IS NULL")
			.param("shopId", shopId)
			.query((rs, n) -> Rating.of(rs.getLong("total"), rs.getInt("n")))
			.single();
	}

	public Map<String, Rating> productRatings(String shopId) {
		Map<String, Rating> out = new LinkedHashMap<>();
		jdbc.sql("""
				SELECT p.product_id, sum(r.rating) AS total, count(*) AS n
				FROM review r JOIN review_product p ON p.review_id = r.id
				WHERE r.shop_id = :shopId AND r.hidden_at IS NULL
				GROUP BY p.product_id ORDER BY p.product_id
				""")
			.param("shopId", shopId)
			.query(rs -> {
				out.put(rs.getString("product_id"), Rating.of(rs.getLong("total"), rs.getInt("n")));
			});
		return out;
	}

	public boolean hide(String id, Instant at, String reason, String by) {
		return jdbc.sql("""
				UPDATE review SET hidden_at = :at, hidden_reason = :reason, hidden_by = :by
				WHERE id = :id AND hidden_at IS NULL
				""")
			.param("id", id)
			.param("at", Timestamp.from(at))
			.param("reason", reason)
			.param("by", by)
			.update() == 1;
	}

	private List<Review> withProducts(List<Review> reviews) {
		if (reviews.isEmpty()) {
			return reviews;
		}
		Map<String, List<Review.Product>> products = new HashMap<>();
		jdbc.sql("SELECT review_id, product_id, product_name FROM review_product WHERE review_id IN (:ids) ORDER BY product_name")
			.param("ids", reviews.stream().map(Review::id).toList())
			.query(rs -> {
				products.computeIfAbsent(rs.getString("review_id"), k -> new ArrayList<>())
					.add(new Review.Product(rs.getString("product_id"), rs.getString("product_name")));
			});
		return reviews.stream()
			.map(r -> new Review(r.id(), r.shopId(), r.orderNumber(), r.rating(), r.text(), r.authorName(),
					r.district(), r.createdAt(), List.copyOf(products.getOrDefault(r.id(), List.of())), r.hiddenAt(),
					r.hiddenReason()))
			.toList();
	}

	private static Review map(ResultSet rs, int n) throws SQLException {
		Timestamp hidden = rs.getTimestamp("hidden_at");
		return new Review(rs.getString("id"), rs.getString("shop_id"), rs.getString("order_number"),
				rs.getInt("rating"), rs.getString("text"), rs.getString("author_name"), rs.getString("district"),
				rs.getTimestamp("created_at").toInstant(), List.of(), hidden == null ? null : hidden.toInstant(),
				rs.getString("hidden_reason"));
	}
}
