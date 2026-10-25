package com.tomurcuk.shop;

import java.time.Instant;

/** Destek ekibi dükkânın durumunu değiştirdi; dükkân sahiplerine e-posta gider. */
public record ShopStatusChanged(String eventId, String shopId, String shopName, ShopStatus from, ShopStatus to,
		String reason, Instant pausedUntil) {
}
