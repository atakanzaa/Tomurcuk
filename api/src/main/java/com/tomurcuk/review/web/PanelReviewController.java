package com.tomurcuk.review.web;

import java.util.List;

import com.tomurcuk.identity.ShopPrincipal;
import com.tomurcuk.review.Review;
import com.tomurcuk.review.Reviews;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/** Dükkân kendi yorumlarını görür, gizlenenler dahil; silemez ve gizleyemez. */
@RestController
class PanelReviewController {

	static final int LIMIT = 200;

	private final Reviews reviews;

	PanelReviewController(Reviews reviews) {
		this.reviews = reviews;
	}

	@GetMapping("/api/panel/reviews")
	List<Review> list(@AuthenticationPrincipal ShopPrincipal user) {
		return reviews.forShop(user.shopId(), LIMIT);
	}
}
