package com.tomurcuk.review;

/** Görünür yorumların ortalaması (bir ondalık) ve sayısı. */
public record Rating(double average, int count) {

	public static final Rating NONE = new Rating(0, 0);

	public static Rating of(double sum, int count) {
		return count == 0 ? NONE : new Rating(Math.round(sum * 10 / count) / 10.0, count);
	}
}
