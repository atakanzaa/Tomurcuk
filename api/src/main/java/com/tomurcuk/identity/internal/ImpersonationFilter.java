package com.tomurcuk.identity.internal;

import java.io.IOException;

import com.tomurcuk.audit.AuditLog;
import com.tomurcuk.identity.Impersonation;
import com.tomurcuk.identity.Impersonations;
import com.tomurcuk.identity.PlatformPrincipal;
import com.tomurcuk.identity.ShopPrincipal;
import com.tomurcuk.identity.ShopRole;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * Destek ekibinin dükkân adına panel isteği. Next, temsilcinin kendi oturumuyla birlikte
 * `X-Tomurcuk-Impersonation` başlığında oturum kimliğini gönderir. Oturum geçerliyse istek
 * boyunca kullanıcı o dükkânın çalışanı yetkisiyle görünür (iptal ve ödeme hesabı kapalı);
 * bu kimlik oturuma kaydedilmez. Değiştiren her istek denetim kaydına yazılır.
 */
class ImpersonationFilter extends OncePerRequestFilter {

	static final String HEADER = "X-Tomurcuk-Impersonation";

	private final Impersonations impersonations;

	private final AuditLog audit;

	ImpersonationFilter(Impersonations impersonations, AuditLog audit) {
		this.impersonations = impersonations;
		this.audit = audit;
	}

	@Override
	protected boolean shouldNotFilter(HttpServletRequest request) {
		return !request.getRequestURI().startsWith("/api/panel/") || request.getHeader(HEADER) == null;
	}

	@Override
	protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
			throws ServletException, IOException {
		Authentication current = SecurityContextHolder.getContext().getAuthentication();
		if (!(current != null && current.getPrincipal() instanceof PlatformPrincipal user)) {
			chain.doFilter(request, response);
			return;
		}
		Impersonation session = impersonations.findActive(request.getHeader(HEADER), user.userId()).orElse(null);
		if (session == null) {
			// Süresi dolmuş ya da başkasına ait oturum: panel yetkisi verilmez, istek 403 olur.
			chain.doFilter(request, response);
			return;
		}
		ShopPrincipal acting = new ShopPrincipal("support:" + user.userId(), session.shopId(), user.name(), user.email(),
				ShopRole.STAFF, session.id());
		SecurityContext context = SecurityContextHolder.createEmptyContext();
		context.setAuthentication(UsernamePasswordAuthenticationToken.authenticated(acting, null,
				PanelAuthentication.authorities(acting)));
		SecurityContextHolder.setContext(context);
		try {
			chain.doFilter(request, response);
		}
		finally {
			SecurityContextHolder.getContext().setAuthentication(current);
		}
		if (!"GET".equals(request.getMethod()) && response.getStatus() < 400) {
			audit.record(new AuditLog.Entry("platform", user.userId(), user.name(), session.shopId(),
					"Dükkân adına işlem", request.getMethod() + " " + request.getRequestURI(), session.reason(),
					request.getRemoteAddr()));
		}
	}
}
