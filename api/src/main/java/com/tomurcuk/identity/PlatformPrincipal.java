package com.tomurcuk.identity;

import java.io.Serializable;

import org.springframework.security.core.AuthenticatedPrincipal;

/** Destek panelinde oturum açmış platform kullanıcısı. */
public record PlatformPrincipal(String userId, String name, String email, PlatformRole role)
		implements AuthenticatedPrincipal, Serializable {

	@Override
	public String getName() {
		return userId;
	}

	public boolean can(Permission permission) {
		return role.permissions().contains(permission);
	}
}
