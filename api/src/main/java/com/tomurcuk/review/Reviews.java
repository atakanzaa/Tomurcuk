package com.tomurcuk.review;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;

import com.tomurcuk.ordering.Order;
import com.tomurcuk.ordering.OrderDirectory;
import com.tomurcuk.ordering.OrderStatus;
import com.tomurcuk.review.internal.ReviewStore;
import com.tomurcuk.shared.FieldError;
import com.tomurcuk.shared.Ids;
import com.tomurcuk.shared.Texts;
import com.tomurcuk.shared.ValidationException;
import com.tomurcuk.shop.ShopDirectory;
import com.tomurcuk.shop.ShopInfo;
import com.tomurcuk.shop.ShopStatus;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Ürün yorumları. Yalnızca teslim edilen siparişin göndereni, takip koduyla ve teslimden sonraki 30
 * gün içinde yazar; her siparişe bir yorum. Yorum siparişteki her ürünün sayfasında görünür.
 * Hatalar: `rating` (`option_invalid`), `text` (`too_long`), `order` (`not_delivered`,
 * `review_closed`, `already_reviewed`). Gizlemenin yetkisini çağıran denetler (support modülü).
 */
@Service
@Transactional(readOnly = true)
public class Reviews {

	static final Duration WRITE_WINDOW = Duration.ofDays(30);

	static final int MAX_TEXT = 500;

	static final String ANONYMOUS = "Bir alıcı";

	private static final Locale TR = Locale.forLanguageTag("tr");

	private final ReviewStore store;

	private final OrderDirectory orders;

	private final ShopDirectory shops;

	private final Clock clock;

	Reviews(ReviewStore store, OrderDirectory orders, ShopDirectory shops, Clock clock) {
		this.store = store;
		this.orders = orders;
		this.shops = shops;
		this.clock = clock;
	}

	/** Takip sayfası: yorum yazılabilir mi, yazıldıysa hangisi. Kod bu dükkânın değilse boş. */
	public Optional<ReviewState> state(String shopId, String token) {
		return orders.findByTrackingToken(shopId, token).map(order -> {
			Optional<Review> existing = store.findByOrder(order.id());
			String reason = existing.isPresent() ? "already_reviewed" : closedReason(order);
			return new ReviewState(reason == null, reason, authorName(order.senderName(), false),
					productName(order), existing.orElse(null));
		});
	}

	@Transactional
	public Optional<Review> write(String shopId, String token, ReviewInput in) {
		Optional<Order> found = orders.findByTrackingToken(shopId, token);
		if (found.isEmpty()) {
			return Optional.empty();
		}
		Order order = found.get();
		Map<String, FieldError> errors = new LinkedHashMap<>();
		String reason = store.findByOrder(order.id()).isPresent() ? "already_reviewed" : closedReason(order);
		if (reason != null) {
			errors.put("order", FieldError.of(reason));
		}
		if (in.rating() == null || in.rating() < 1 || in.rating() > 5) {
			errors.put("rating", FieldError.of("option_invalid"));
		}
		String text = Texts.check(errors, "text", in.text(), MAX_TEXT, false);
		if (!errors.isEmpty()) {
			throw new ValidationException(errors);
		}
		Review review = new Review(Ids.newId(), shopId, order.number(), in.rating(), text,
				authorName(order.senderName(), in.hideName()), district(order.zoneName()), clock.instant(),
				products(order), null, null);
		try {
			store.insert(order.id(), review);
		}
		catch (DuplicateKeyException ex) {
			// Aynı anda gelen ikinci gönderim.
			throw ValidationException.of("order", FieldError.of("already_reviewed"));
		}
		return Optional.of(review);
	}

	public ShopRatings ratings(String shopId) {
		return new ShopRatings(store.shopRating(shopId), store.productRatings(shopId));
	}

	public ProductReviews forProduct(String shopId, String productId, int limit) {
		Rating rating = store.productRatings(shopId).getOrDefault(productId, Rating.NONE);
		return new ProductReviews(rating, store.visibleByProduct(shopId, productId, limit));
	}

	/** Gizlenenler dahil; panel ve destek. */
	public List<Review> forShop(String shopId, int limit) {
		return store.byShop(shopId, limit);
	}

	public Optional<Review> find(String reviewId) {
		return store.find(reviewId);
	}

	/** Alıcı ana sayfası: farklı dükkânlardan en yeni yorumlar; kapalı ya da askıdaki dükkân yok. */
	public List<RecentReview> recent(int limit) {
		List<RecentReview> out = new ArrayList<>();
		for (Review review : store.recentAcrossShops(limit * 3)) {
			Optional<ShopInfo> shop = shops.find(review.shopId())
				.filter(s -> s.status() != ShopStatus.SUSPENDED && s.status() != ShopStatus.CLOSED);
			if (shop.isPresent() && out.size() < limit) {
				String product = review.products().isEmpty() ? "" : review.products().getFirst().productName();
				out.add(new RecentReview(review.id(), review.rating(), review.text(), review.authorName(),
						review.district(), review.createdAt(), product, shop.get().slug(), shop.get().name()));
			}
		}
		return out;
	}

	/** Gerekçeyle gizler; zaten gizliyse ya da yoksa boş. Hata: `reason` (`required`, `too_long`). */
	@Transactional
	public Optional<Review> hide(String reviewId, String reason, String by) {
		Map<String, FieldError> errors = new LinkedHashMap<>();
		String text = Texts.check(errors, "reason", reason, MAX_TEXT, true);
		if (!errors.isEmpty()) {
			throw new ValidationException(errors);
		}
		if (!store.hide(reviewId, clock.instant(), text, by)) {
			return Optional.empty();
		}
		return store.find(reviewId);
	}

	private String closedReason(Order order) {
		if (order.status() != OrderStatus.DELIVERED) {
			return "not_delivered";
		}
		Instant delivered = order.events()
			.stream()
			.filter(e -> e.status() == OrderStatus.DELIVERED)
			.map(Order.Event::at)
			.reduce((a, b) -> b)
			.orElse(order.createdAt());
		return clock.instant().isAfter(delivered.plus(WRITE_WINDOW)) ? "review_closed" : null;
	}

	/** "Elif Yılmaz" → "Elif Y.", "Ayşe" → "Ayşe"; ad yoksa ya da gizlenmek istenirse "Bir alıcı". */
	static String authorName(String senderName, boolean hide) {
		String[] words = senderName == null ? new String[0] : senderName.strip().split("\\s+");
		if (hide || words.length == 0 || words[0].isEmpty()) {
			return ANONYMOUS;
		}
		if (words.length == 1) {
			return words[0];
		}
		String last = words[words.length - 1];
		return words[0] + " " + last.substring(0, 1).toUpperCase(TR) + ".";
	}

	/** "Caferağa, Kadıköy" → "Kadıköy". */
	private static String district(String zoneName) {
		if (zoneName == null) {
			return "";
		}
		String[] parts = zoneName.split(",");
		return parts[parts.length - 1].strip();
	}

	private static List<Review.Product> products(Order order) {
		Map<String, Review.Product> out = new LinkedHashMap<>();
		for (Order.Item item : order.items()) {
			if (item.productId() != null && !item.productId().isBlank()) {
				out.putIfAbsent(item.productId(), new Review.Product(item.productId(), item.productName()));
			}
		}
		return List.copyOf(out.values());
	}

	private static String productName(Order order) {
		return order.items().isEmpty() ? "" : order.items().getFirst().productName();
	}
}
