package com.tomurcuk.review;

import java.time.Instant;
import java.util.List;

/**
 * Bir siparişin yorumu; JSON'u web/lib/api/types.ts `Review`. Ad ("Elif Y." ya da "Bir alıcı")
 * ve semt yazıldığı anda kopyalanır. Gizlenen yorum yalnızca panelde ve destekte görünür.
 */
public record Review(String id, String shopId, String orderNumber, int rating, String text, String authorName,
		String district, Instant createdAt, List<Product> products, Instant hiddenAt, String hiddenReason) {

	public record Product(String productId, String productName) {
	}

	public boolean hidden() {
		return hiddenAt != null;
	}
}
