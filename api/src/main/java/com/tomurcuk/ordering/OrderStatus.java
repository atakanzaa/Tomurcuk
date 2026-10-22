package com.tomurcuk.ordering;

import com.fasterxml.jackson.annotation.JsonValue;
import com.tomurcuk.shared.CodedEnum;

/** Durum akışı: Yeni → Hazırlanıyor → Yolda → Teslim edildi; ayrıca Teslim edilemedi ve İptal. */
public enum OrderStatus implements CodedEnum {

	NEW("new"), PREPARING("preparing"), ON_WAY("onway"), DELIVERED("delivered"), FAILED("failed"), CANCELLED("cancelled");

	private final String code;

	OrderStatus(String code) {
		this.code = code;
	}

	@Override
	@JsonValue
	public String code() {
		return code;
	}

	public static OrderStatus fromCode(String code) {
		return CodedEnum.fromCode(OrderStatus.class, code);
	}
}
