package com.tomurcuk;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZoneOffset;

/** Testlerde "şimdi"yi sabitlemek için. */
public class MutableClock extends Clock {

	private volatile Instant now;

	public MutableClock(Instant now) {
		this.now = now;
	}

	public void set(Instant instant) {
		this.now = instant;
	}

	@Override
	public ZoneId getZone() {
		return ZoneOffset.UTC;
	}

	@Override
	public Clock withZone(ZoneId zone) {
		MutableClock outer = this;
		return new Clock() {

			@Override
			public ZoneId getZone() {
				return zone;
			}

			@Override
			public Clock withZone(ZoneId other) {
				return outer.withZone(other);
			}

			@Override
			public Instant instant() {
				return outer.instant();
			}
		};
	}

	@Override
	public Instant instant() {
		return now;
	}
}
