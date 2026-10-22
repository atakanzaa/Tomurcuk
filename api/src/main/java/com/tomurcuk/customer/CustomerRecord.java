package com.tomurcuk.customer;

/** Müşteri kartı; JSON'u web/lib/api/types.ts `Customer`. Telefon "0532 412 88 19" biçiminde. */
public record CustomerRecord(String id, String shopId, String name, String phone, String email, String note,
		boolean marketingConsent) {
}
