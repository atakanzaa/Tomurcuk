package com.tomurcuk.shop;

import java.time.LocalTime;
import java.time.ZoneId;

/** Diğer modüllerin dükkândan ihtiyaç duyduğu bilgiler. */
public record ShopInfo(String id, String slug, String name, boolean active, LocalTime sameDayCutoff,
		ZoneId timeZone) {
}
