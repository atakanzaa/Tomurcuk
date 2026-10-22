package com.tomurcuk.ordering.internal;

import java.time.LocalDate;

import com.tomurcuk.customer.SpecialDay;

/** web/lib/api/types.ts `Reminder`. `date` bu yılki (ya da gelecek yılki) tarihtir. */
public record Reminder(SpecialDay specialDay, CustomerSummary customer, LocalDate date, LastYear lastYear) {

	public record LastYear(String productName, long total) {
	}
}
