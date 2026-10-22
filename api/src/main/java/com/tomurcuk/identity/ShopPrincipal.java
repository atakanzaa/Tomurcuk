package com.tomurcuk.identity;

import java.io.Serializable;

import org.springframework.security.core.AuthenticatedPrincipal;

/**
 * Panelde oturum açmış kullanıcı. Oturum veritabanında tutulduğu için serileştirilebilir.
 * Paneldeki her sorgu `shopId` ile sınırlıdır; dükkân kimliği istekten değil buradan gelir.
 */
public record ShopPrincipal(String userId, String shopId, String name, String email, ShopRole role)
		implements AuthenticatedPrincipal, Serializable {

	/** Oturum kaydında kullanıcıyı tanıtan ad (spring_session.principal_name). */
	@Override
	public String getName() {
		return userId;
	}

	public boolean can(Permission permission) {
		return role.permissions().contains(permission);
	}
}
