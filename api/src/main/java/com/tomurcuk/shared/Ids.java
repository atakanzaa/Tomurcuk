package com.tomurcuk.shared;

import java.security.SecureRandom;

import com.github.f4b6a3.ulid.UlidCreator;

/** Dışa açık kimlikler: kayıtlar için ULID, linkler için tahmin edilemez token. */
public final class Ids {

	private static final SecureRandom RANDOM = new SecureRandom();

	private static final char[] ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789".toCharArray();

	private Ids() {
	}

	public static String newId() {
		return UlidCreator.getMonotonicUlid().toString();
	}

	/** Karışan harfler (0/O, 1/l/I) olmadan rastgele dizi; takip linki ve taslak kimliği için. */
	public static String token(int length) {
		char[] out = new char[length];
		for (int i = 0; i < length; i++) {
			out[i] = ALPHABET[RANDOM.nextInt(ALPHABET.length)];
		}
		return new String(out);
	}
}
