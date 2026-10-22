package com.tomurcuk.ordering;

import com.fasterxml.jackson.annotation.JsonValue;
import com.tomurcuk.shared.CodedEnum;

/** Kartla ödemede sağlayıcı onaylayana, havalede dükkân işaretleyene kadar `PENDING`. */
public enum PaymentStatus implements CodedEnum {

	PENDING("pending"), PAID("paid"), UNPAID("unpaid");

	private final String code;

	PaymentStatus(String code) {
		this.code = code;
	}

	@Override
	@JsonValue
	public String code() {
		return code;
	}

	public static PaymentStatus fromCode(String code) {
		return CodedEnum.fromCode(PaymentStatus.class, code);
	}
}
