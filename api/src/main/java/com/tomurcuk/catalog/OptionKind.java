package com.tomurcuk.catalog;

import com.fasterxml.jackson.annotation.JsonValue;
import com.tomurcuk.shared.CodedEnum;

/** Ürün seçeneğinin türü: boy (biri seçilir), vazo, diğer eklemeler. */
public enum OptionKind implements CodedEnum {

	SIZE("size"), VASE("vase"), ADDON("addon");

	private final String code;

	OptionKind(String code) {
		this.code = code;
	}

	@Override
	@JsonValue
	public String code() {
		return code;
	}
}
