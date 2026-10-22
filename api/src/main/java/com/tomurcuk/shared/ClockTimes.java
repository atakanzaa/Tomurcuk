package com.tomurcuk.shared;

import java.time.LocalTime;
import java.time.format.DateTimeFormatter;

/** Saatler API'de "HH:mm" biçiminde taşınır (frontend'deki `ClockTime`). */
public final class ClockTimes {

	private static final DateTimeFormatter HH_MM = DateTimeFormatter.ofPattern("HH:mm");

	private ClockTimes() {
	}

	public static String format(LocalTime time) {
		return time == null ? null : time.format(HH_MM);
	}
}
