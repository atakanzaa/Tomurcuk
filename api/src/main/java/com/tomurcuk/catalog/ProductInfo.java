package com.tomurcuk.catalog;

import java.util.List;

/** Siparişin ihtiyaç duyduğu güncel ürün bilgisi; fiyatlar kuruş. */
public record ProductInfo(String id, String name, long price, List<Option> options) {

	public record Option(String id, String name, String detail, OptionKind kind, long extraPrice) {
	}
}
