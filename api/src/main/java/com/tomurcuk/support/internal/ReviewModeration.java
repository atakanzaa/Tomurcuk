package com.tomurcuk.support.internal;

import java.util.Optional;

import com.tomurcuk.audit.AuditLog;
import com.tomurcuk.identity.PlatformPrincipal;
import com.tomurcuk.review.Review;
import com.tomurcuk.review.Reviews;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Destek ekibinin bütün rolleri yorumu gerekçeyle gizler; yorum silinmez, dükkân panelinde
 * "Gizlendi" olarak kalır. Her gizleme denetim kaydına yazılır.
 */
@Service
public class ReviewModeration {

	private final Reviews reviews;

	private final AuditLog audit;

	ReviewModeration(Reviews reviews, AuditLog audit) {
		this.reviews = reviews;
		this.audit = audit;
	}

	public record HideInput(String reason) {
	}

	/** Yorum yoksa ya da zaten gizliyse boş. */
	@Transactional
	public Optional<Review> hide(PlatformPrincipal user, String reviewId, HideInput input) {
		Optional<Review> hidden = reviews.hide(reviewId, input.reason(), user.name());
		hidden.ifPresent(review -> audit.record(new AuditLog.Entry("platform", user.userId(), user.name(),
				review.shopId(), "Yorum gizlendi", review.orderNumber(), review.hiddenReason(), null)));
		return hidden;
	}
}
