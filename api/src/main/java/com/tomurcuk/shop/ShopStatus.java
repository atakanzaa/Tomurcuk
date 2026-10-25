package com.tomurcuk.shop;

import com.fasterxml.jackson.annotation.JsonValue;
import com.tomurcuk.shared.CodedEnum;

/**
 * Dükkânın durumu; destek ekibi değiştirir. `PAUSED`: siparişe geçici kapalı, vitrin açık.
 * `SUSPENDED`: askıda, vitrinde yalnızca adı, panel açık. `CLOSED`: kalıcı kapalı, vitrin 404,
 * panel girişi yok. Var olan siparişler hiçbir durumda silinmez.
 */
public enum ShopStatus implements CodedEnum {

	OPEN("open"), PAUSED("paused"), SUSPENDED("suspended"), CLOSED("closed");

	private final String code;

	ShopStatus(String code) {
		this.code = code;
	}

	@Override
	@JsonValue
	public String code() {
		return code;
	}

	public static ShopStatus fromCode(String code) {
		for (ShopStatus status : values()) {
			if (status.code.equals(code)) {
				return status;
			}
		}
		throw new IllegalArgumentException(code);
	}
}
