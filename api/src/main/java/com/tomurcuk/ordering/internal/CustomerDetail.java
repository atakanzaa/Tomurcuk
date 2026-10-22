package com.tomurcuk.ordering.internal;

import java.util.List;

import com.tomurcuk.customer.SpecialDay;
import com.tomurcuk.ordering.Order;

/** web/lib/api/types.ts `CustomerDetail`; siparişler yeniden eskiye. */
public record CustomerDetail(CustomerSummary customer, List<Order> orders, List<SpecialDay> specialDays) {
}
