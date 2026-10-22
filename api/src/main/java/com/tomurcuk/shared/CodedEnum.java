package com.tomurcuk.shared;

import java.util.Arrays;

/**
 * Veritabanında ve JSON'da küçük harfli kodla ("pro", "size") tutulan sabit kümeler.
 * Kodlar frontend'deki `as const` nesnelerinin değerleriyle aynıdır (web/lib/api/types.ts).
 */
public interface CodedEnum {

	String code();

	static <E extends Enum<E> & CodedEnum> E fromCode(Class<E> type, String code) {
		return Arrays.stream(type.getEnumConstants())
			.filter(value -> value.code().equals(code))
			.findFirst()
			.orElseThrow(() -> new IllegalArgumentException("Bilinmeyen " + type.getSimpleName() + " kodu: " + code));
	}
}
