package com.tomurcuk.shared;

import java.util.Optional;

import com.google.i18n.phonenumbers.NumberParseException;
import com.google.i18n.phonenumbers.PhoneNumberUtil;
import com.google.i18n.phonenumbers.Phonenumber.PhoneNumber;

/**
 * Türkiye telefon numaraları. Doğrulama libphonenumber ile yapılır; numara tek biçimde
 * saklanır ve gösterilir: "0532 412 88 19".
 */
public final class Phones {

	private static final PhoneNumberUtil UTIL = PhoneNumberUtil.getInstance();

	private Phones() {
	}

	/** "+90 532 412 8819", "05324128819" → "0532 412 88 19"; geçersizse boş. */
	public static Optional<String> normalize(String input) {
		if (input == null || input.isBlank()) {
			return Optional.empty();
		}
		try {
			PhoneNumber number = UTIL.parse(input, "TR");
			if (number.getCountryCode() != 90 || !UTIL.isValidNumber(number)) {
				return Optional.empty();
			}
			String digits = UTIL.getNationalSignificantNumber(number);
			return digits.length() == 10 ? Optional.of(format(digits)) : Optional.empty();
		}
		catch (NumberParseException ex) {
			return Optional.empty();
		}
	}

	private static String format(String digits) {
		return "0" + digits.substring(0, 3) + " " + digits.substring(3, 6) + " " + digits.substring(6, 8) + " "
				+ digits.substring(8);
	}
}
