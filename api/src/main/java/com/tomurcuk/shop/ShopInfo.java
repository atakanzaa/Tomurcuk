package com.tomurcuk.shop;

import java.time.LocalTime;
import java.time.ZoneId;

/** Diğer modüllerin dükkândan ihtiyaç duyduğu bilgiler. `status` geçici kapatmanın süresine bakılmış haldir. */
public record ShopInfo(String id, String slug, String name, ShopStatus status, LocalTime sameDayCutoff,
		ZoneId timeZone) {

	public boolean acceptsOrders() {
		return status == ShopStatus.OPEN;
	}
}
