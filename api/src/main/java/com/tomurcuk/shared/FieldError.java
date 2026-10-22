package com.tomurcuk.shared;

import java.util.Map;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * Bir alanın doğrulama hatası. Kodlar frontend'deki `CheckoutError` değerleridir; Türkçe
 * mesajı frontend üretir. `meta` mesaj için ek bilgi taşır (dolu aralığın alternatifi gibi).
 */
@JsonInclude(JsonInclude.Include.NON_EMPTY)
public record FieldError(String code, Map<String, Object> meta) {

	public static FieldError of(String code) {
		return new FieldError(code, Map.of());
	}

	public static FieldError of(String code, Map<String, Object> meta) {
		return new FieldError(code, meta);
	}
}
