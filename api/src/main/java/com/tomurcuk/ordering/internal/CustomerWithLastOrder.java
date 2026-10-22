package com.tomurcuk.ordering.internal;

import com.fasterxml.jackson.annotation.JsonUnwrapped;

/** Müşteri özeti ve son siparişi tek nesnede: `CustomerSummary & { lastOrder }`. */
public record CustomerWithLastOrder(@JsonUnwrapped CustomerSummary customer, Order lastOrder) {

	static CustomerWithLastOrder of(CustomerSummary customer, Order lastOrder) {
		return new CustomerWithLastOrder(customer, lastOrder);
	}
}
