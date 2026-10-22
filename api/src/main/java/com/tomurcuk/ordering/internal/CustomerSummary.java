package com.tomurcuk.ordering.internal;

import java.time.Instant;

import com.tomurcuk.customer.CustomerRecord;

/** web/lib/api/types.ts `CustomerSummary`; sayı ve toplam iptal edilmemiş siparişlerden. */
public record CustomerSummary(String id, String shopId, String name, String phone, String email, String note,
		boolean marketingConsent, int orderCount, long totalSpent, Instant lastOrderAt) {

	static CustomerSummary of(CustomerRecord c, OrderStore.CustomerTotals totals) {
		return new CustomerSummary(c.id(), c.shopId(), c.name(), c.phone(), c.email(), c.note(), c.marketingConsent(),
				totals == null ? 0 : totals.orderCount(), totals == null ? 0 : totals.totalSpent(),
				totals == null ? null : totals.lastOrderAt());
	}
}
