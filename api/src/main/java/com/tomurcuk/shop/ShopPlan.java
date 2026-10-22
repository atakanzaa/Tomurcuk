package com.tomurcuk.shop;

import com.fasterxml.jackson.annotation.JsonValue;
import com.tomurcuk.shared.CodedEnum;

public enum ShopPlan implements CodedEnum {

	PILOT("pilot"), STARTER("starter"), PRO("pro");

	private final String code;

	ShopPlan(String code) {
		this.code = code;
	}

	@Override
	@JsonValue
	public String code() {
		return code;
	}
}
