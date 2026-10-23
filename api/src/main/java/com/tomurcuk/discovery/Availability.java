package com.tomurcuk.discovery;

import com.fasterxml.jackson.annotation.JsonValue;
import com.tomurcuk.shared.CodedEnum;

/** Dükkânın seçilen günde o semte teslim edip edemeyeceği; web/lib/api/types.ts `Availability`. */
public enum Availability implements CodedEnum {

	/** Müsait aralık var, son sipariş saati geçmedi. */
	OPEN("open"),
	/** Bugün için son sipariş saati geçti. */
	SAME_DAY_CLOSED("same_day_closed"),
	/** Bütün aralıklar dolu ya da başlama saatleri geçti. */
	FULL("full"),
	/** Dükkân o gün kapalı. */
	CLOSED("closed");

	private final String code;

	Availability(String code) {
		this.code = code;
	}

	@Override
	@JsonValue
	public String code() {
		return code;
	}
}
