package com.tomurcuk.shared;

import java.text.DecimalFormat;
import java.text.DecimalFormatSymbols;
import java.util.Locale;

/** Para metinleri: "1.250 TL", kuruşlu ise "720,50 TL" (web/lib/format.ts ile aynı). */
public final class Money {

	private static final DecimalFormatSymbols TR = DecimalFormatSymbols.getInstance(Locale.forLanguageTag("tr"));

	private Money() {
	}

	public static String format(long kurus) {
		DecimalFormat format = new DecimalFormat(kurus % 100 == 0 ? "#,##0" : "#,##0.00", TR);
		return format.format(kurus / 100.0) + " TL";
	}
}
