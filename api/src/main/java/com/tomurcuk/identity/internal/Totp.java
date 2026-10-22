package com.tomurcuk.identity.internal;

import java.nio.ByteBuffer;
import java.security.GeneralSecurityException;
import java.time.Instant;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

/**
 * RFC 6238 zaman tabanlı tek kullanımlık kod: HMAC-SHA1, 30 saniye, 6 hane. Telefon saatindeki
 * küçük kaymalar için bir önceki ve bir sonraki adım da kabul edilir. Gizli anahtar Base32.
 */
final class Totp {

	private static final int STEP_SECONDS = 30;

	private static final String BASE32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

	private Totp() {
	}

	static boolean verify(String secretBase32, String code, Instant now) {
		if (secretBase32 == null || code == null || !code.strip().matches("\\d{6}")) {
			return false;
		}
		byte[] key = decode(secretBase32);
		long step = now.getEpochSecond() / STEP_SECONDS;
		for (long offset = -1; offset <= 1; offset++) {
			if (generate(key, step + offset).equals(code.strip())) {
				return true;
			}
		}
		return false;
	}

	static String generate(String secretBase32, Instant now) {
		return generate(decode(secretBase32), now.getEpochSecond() / STEP_SECONDS);
	}

	private static String generate(byte[] key, long step) {
		try {
			Mac mac = Mac.getInstance("HmacSHA1");
			mac.init(new SecretKeySpec(key, "HmacSHA1"));
			byte[] hash = mac.doFinal(ByteBuffer.allocate(8).putLong(step).array());
			int offset = hash[hash.length - 1] & 0x0f;
			int binary = ((hash[offset] & 0x7f) << 24) | ((hash[offset + 1] & 0xff) << 16)
					| ((hash[offset + 2] & 0xff) << 8) | (hash[offset + 3] & 0xff);
			return String.format("%06d", binary % 1_000_000);
		}
		catch (GeneralSecurityException ex) {
			throw new IllegalStateException(ex);
		}
	}

	private static byte[] decode(String base32) {
		String clean = base32.replace("=", "").replace(" ", "").toUpperCase();
		ByteBuffer out = ByteBuffer.allocate(clean.length() * 5 / 8);
		int buffer = 0;
		int bits = 0;
		for (char c : clean.toCharArray()) {
			int value = BASE32.indexOf(c);
			if (value < 0) {
				throw new IllegalArgumentException("Geçersiz Base32");
			}
			buffer = (buffer << 5) | value;
			bits += 5;
			if (bits >= 8) {
				out.put((byte) (buffer >> (bits - 8)));
				bits -= 8;
			}
		}
		return out.array();
	}
}
