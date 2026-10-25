package com.tomurcuk.review.web;

import java.util.List;

import com.tomurcuk.review.ProductReviews;
import com.tomurcuk.review.RecentReview;
import com.tomurcuk.review.Review;
import com.tomurcuk.review.ReviewInput;
import com.tomurcuk.review.ReviewState;
import com.tomurcuk.review.Reviews;
import com.tomurcuk.review.ShopRatings;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

/** Alıcının yorumları: takip sayfasından yazma, vitrinde, ürün sayfasında ve ana sayfada okuma. */
@RestController
class PublicReviewController {

	static final int PRODUCT_LIMIT = 30;

	static final int RECENT_LIMIT = 6;

	private final Reviews reviews;

	PublicReviewController(Reviews reviews) {
		this.reviews = reviews;
	}

	@GetMapping("/api/public/shops/{shopId}/tracking/{token}/review")
	ReviewState state(@PathVariable String shopId, @PathVariable String token) {
		return reviews.state(shopId, token).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
	}

	@PostMapping("/api/public/shops/{shopId}/tracking/{token}/review")
	@ResponseStatus(HttpStatus.CREATED)
	Review write(@PathVariable String shopId, @PathVariable String token, @RequestBody ReviewInput body) {
		return reviews.write(shopId, token, body).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
	}

	@GetMapping("/api/public/shops/{shopId}/ratings")
	ShopRatings ratings(@PathVariable String shopId) {
		return reviews.ratings(shopId);
	}

	@GetMapping("/api/public/shops/{shopId}/products/{productId}/reviews")
	ProductReviews forProduct(@PathVariable String shopId, @PathVariable String productId) {
		return reviews.forProduct(shopId, productId, PRODUCT_LIMIT);
	}

	@GetMapping("/api/public/discover/reviews")
	List<RecentReview> recent() {
		return reviews.recent(RECENT_LIMIT);
	}
}
