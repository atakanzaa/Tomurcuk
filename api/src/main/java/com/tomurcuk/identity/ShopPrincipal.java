package com.tomurcuk.identity;

import java.io.Serializable;

import org.springframework.security.core.AuthenticatedPrincipal;

/**
 * Panelde oturum açmış kullanıcı. Oturum veritabanında tutulduğu için serileştirilebilir.
 * Paneldeki her sorgu `shopId` ile sınırlıdır; dükkân kimliği istekten değil buradan gelir.
 * Destek ekibi dükkân adına girdiyse `impersonationId` doludur, ad destek temsilcisinindir ve
 * yetki çalışan düzeyindedir.
 */
public record ShopPrincipal(String userId, String shopId, String name, String email, ShopRole role,
		String impersonationId) implements AuthenticatedPrincipal, Serializable {

	public ShopPrincipal(String userId, String shopId, String name, String email, ShopRole role) {
		this(userId, shopId, name, email, role, null);
	}

	/** Oturum kaydında kullanıcıyı tanıtan ad (spring_session.principal_name). */
	@Override
	public String getName() {
		return userId;
	}

	public boolean can(Permission permission) {
		return role.permissions().contains(permission);
	}
}
