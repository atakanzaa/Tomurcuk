package com.tomurcuk.customer;

/** Özel gün; yıl tutulmaz. JSON'u web/lib/api/types.ts `SpecialDay`. */
public record SpecialDay(String id, String customerId, String title, int day, int month, String recipientName) {
}
