package com.tomurcuk.discovery;

import java.time.LocalDate;
import java.util.List;

import com.tomurcuk.catalog.ProductCard;

/**
 * Seçilen semte teslim eden dükkân; web/lib/api/types.ts `ShopMatch`. Ücret kuruş. `cutoff`
 * yalnızca bugün ve sipariş verilebilirken doludur; `next` sipariş verilemiyorsa ilk müsait
 * gün ve aralıktır.
 */
public record ShopMatch(String slug, String name, String address, String descriptionShort, long deliveryFee,
		Availability availability, String cutoff, List<Slot> slots, NextSlot next, List<ProductCard> products) {

	public record Slot(String start, String end) {
	}

	public record NextSlot(LocalDate date, String start, String end) {
	}
}
