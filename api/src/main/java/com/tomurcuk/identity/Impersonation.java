package com.tomurcuk.identity;

import java.time.Instant;

/** Dükkân adına açılmış süreli oturum; JSON'u web/lib/api/types.ts `Impersonation`. */
public record Impersonation(String id, String supportUserName, String shopId, String reason, Instant startedAt,
		Instant endsAt) {
}
