package com.tomurcuk.identity;

import java.util.EnumSet;
import java.util.Set;

import com.fasterxml.jackson.annotation.JsonValue;
import com.tomurcuk.shared.CodedEnum;

/**
 * Destek ekibinin rolleri (docs/mvp.md "Yetki matrisi"). Temsilci telefonu maskeli görür ve
 * gerekçeyle açar; iptal ve iadeyi lidere aktarır; denetim kaydında yalnızca kendi işlemlerini
 * görür. Ödeme hesabını kimse dükkân adına değiştiremez.
 */
public enum PlatformRole implements CodedEnum {

	OWNER("owner", EnumSet.allOf(Permission.class)),

	LEAD("lead", EnumSet.allOf(Permission.class)),

	AGENT("agent", EnumSet.of(Permission.CATALOG_EDIT, Permission.SHOP_IMPERSONATE));

	private final String code;

	private final Set<Permission> permissions;

	PlatformRole(String code, Set<Permission> permissions) {
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

	public static PlatformRole fromCode(String code) {
		return CodedEnum.fromCode(PlatformRole.class, code);
	}
}
