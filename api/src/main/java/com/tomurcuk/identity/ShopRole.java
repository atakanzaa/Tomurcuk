package com.tomurcuk.identity;

import java.util.EnumSet;
import java.util.Set;

import com.fasterxml.jackson.annotation.JsonValue;
import com.tomurcuk.shared.CodedEnum;

/**
 * Dükkân kullanıcısının rolü ve izinleri. Platform rolleri (destek) gelince rol ve izinler
 * tabloya taşınır; şimdilik matris koddadır.
 */
public enum ShopRole implements CodedEnum {

	OWNER("owner", EnumSet.of(Permission.ORDER_CANCEL, Permission.REFUND_START, Permission.CUSTOMER_PII_VIEW,
			Permission.CATALOG_EDIT)),

	STAFF("staff", EnumSet.of(Permission.CUSTOMER_PII_VIEW));

	private final String code;

	private final Set<Permission> permissions;

	ShopRole(String code, Set<Permission> permissions) {
		this.code = code;
		this.permissions = permissions;
	}

	@Override
	@JsonValue
	public String code() {
		return code;
	}

	public Set<Permission> permissions() {
		return permissions;
	}

	public static ShopRole fromCode(String code) {
		return CodedEnum.fromCode(ShopRole.class, code);
	}
}
