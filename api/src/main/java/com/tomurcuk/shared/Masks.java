package com.tomurcuk.shared;

/** Destek ekibi kişisel veriyi maskeli görür (web/lib/mask.ts ile aynı). */
public final class Masks {

	private Masks() {
	}

	/** "0532 412 88 19" → "0532 *** ** 19" */
	public static String phone(String phone) {
		if (phone == null || phone.isBlank()) {
			return phone;
		}
		String[] parts = phone.split(" ");
		if (parts.length != 4) {
			return phone.replaceAll("\\d(?=\\d{2})", "*");
		}
		return parts[0] + " *** ** " + parts[3];
	}

	/** "Elif Yılmaz" → "Elif Y." */
	public static String shortName(String name) {
		if (name == null || name.isBlank()) {
			return "";
		}
		String[] parts = name.strip().split("\\s+");
		return parts.length == 1 ? parts[0] : parts[0] + " " + parts[parts.length - 1].charAt(0) + ".";
	}
}
