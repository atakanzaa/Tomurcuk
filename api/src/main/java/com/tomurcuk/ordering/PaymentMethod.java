package com.tomurcuk.ordering;

import com.fasterxml.jackson.annotation.JsonValue;
import com.tomurcuk.shared.CodedEnum;

/** Alıcı kart ya da havale seçer; kapıda ödeme yalnızca panelden girilen siparişlerde. */
public enum PaymentMethod implements CodedEnum {

	CARD("card"), TRANSFER("transfer"), CASH("cash");

	private final String code;

	PaymentMethod(String code) {
		this.code = code;
	}

	@Override
	@JsonValue
	public String code() {
		return code;
	}

	public static PaymentMethod fromCode(String code) {
		return CodedEnum.fromCode(PaymentMethod.class, code);
	}
}
