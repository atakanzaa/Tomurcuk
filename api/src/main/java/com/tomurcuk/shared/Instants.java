package com.tomurcuk.shared;

import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;

/** PostgreSQL sürücüsü `Instant` bağlayamaz; anlar `timestamptz` sütunlarına UTC olarak yazılır. */
public final class Instants {

	private Instants() {
	}

	public static OffsetDateTime sql(Instant instant) {
		return instant == null ? null : instant.atOffset(ZoneOffset.UTC);
	}
}
