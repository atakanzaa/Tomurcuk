package com.tomurcuk.identity.internal;

import java.time.Instant;

/** Testlerde doğrulama kodu üretmek için. */
public final class TotpCodes {

	private TotpCodes() {
	}

	public static String at(String secretBase32, Instant now) {
		return Totp.generate(secretBase32, now);
	}
}
