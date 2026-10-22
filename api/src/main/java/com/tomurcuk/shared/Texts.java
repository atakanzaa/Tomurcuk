package com.tomurcuk.shared;

import java.util.Map;

/** Serbest metin alanlarının ortak doğrulaması: boşlukları kırpar, zorunluluk ve uzunluk. */
public final class Texts {

	private Texts() {
	}

	/**
	 * Hata varsa `errors`'a yazar ve kırpılmış değeri döner. Kodlar: `required`,
	 * `too_long` (meta: max).
	 */
	public static String check(Map<String, FieldError> errors, String field, String value, int max,
			boolean required) {
		String trimmed = value == null ? "" : value.strip();
		if (required && trimmed.isEmpty()) {
			errors.put(field, FieldError.of("required"));
		}
		else if (trimmed.length() > max) {
			errors.put(field, FieldError.of("too_long", Map.of("max", max)));
		}
		return trimmed;
	}

	/** Telefon zorunludur; geçersizse `phone_invalid`. */
	public static String phone(Map<String, FieldError> errors, String field, String value) {
		if (value == null || value.isBlank()) {
			errors.put(field, FieldError.of("required"));
			return "";
		}
		return Phones.normalize(value).orElseGet(() -> {
			errors.put(field, FieldError.of("phone_invalid"));
			return "";
		});
	}
}
