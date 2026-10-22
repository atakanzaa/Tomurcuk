package com.tomurcuk.ordering;

import com.fasterxml.jackson.annotation.JsonValue;
import com.tomurcuk.shared.CodedEnum;

/** Siparişin geldiği kanal. */
public enum OrderSource implements CodedEnum {

	LINK("link"), PHONE("phone"), WHATSAPP("whatsapp"), INSTAGRAM("instagram"), STORE("store"), CICEKSEPETI("ciceksepeti");

	private final String code;

	OrderSource(String code) {
		this.code = code;
	}

	@Override
	@JsonValue
	public String code() {
		return code;
	}

	public static OrderSource fromCode(String code) {
		return CodedEnum.fromCode(OrderSource.class, code);
	}
}
