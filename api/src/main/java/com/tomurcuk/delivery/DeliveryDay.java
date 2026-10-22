package com.tomurcuk.delivery;

import java.time.LocalDate;
import java.util.List;

/**
 * web/lib/api/types.ts `DeliveryDay`. Kapalı günde aralık listelenmez; bugün için başlama
 * saati geçmiş aralıklar listede yoktur.
 */
public record DeliveryDay(LocalDate date, boolean closed, boolean sameDayClosed, List<SlotRemaining> slots) {

	public record SlotRemaining(String slotId, int remaining) {
	}
}
