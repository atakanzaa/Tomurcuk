package com.tomurcuk.identity.internal;

import java.io.IOException;

import com.tomurcuk.identity.ShopPrincipal;
import com.tomurcuk.shop.ShopDirectory;
import com.tomurcuk.shop.ShopInfo;
import com.tomurcuk.shop.ShopStatus;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * Kalıcı kapatılan dükkânın açık panel oturumları: bir sonraki istekte oturum kapanır ve 401
 * döner. Girişi `PanelAuthentication` reddeder; bu süzgeç kapatmadan önce açılmış oturumlar
 * içindir.
 */
class ClosedShopFilter extends OncePerRequestFilter {

	private final ShopDirectory shops;

	ClosedShopFilter(ShopDirectory shops) {
		this.shops = shops;
	}

	@Override
	protected boolean shouldNotFilter(HttpServletRequest request) {
		return !request.getRequestURI().startsWith("/api/panel/") || request.getRequestURI().startsWith("/api/panel/auth/");
	}

	@Override
	protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
			throws ServletException, IOException {
		Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
		if (authentication != null && authentication.getPrincipal() instanceof ShopPrincipal principal
				&& shops.find(principal.shopId()).map(ShopInfo::status).orElse(ShopStatus.CLOSED) == ShopStatus.CLOSED) {
			SecurityContextHolder.clearContext();
			HttpSession session = request.getSession(false);
			if (session != null) {
				session.invalidate();
			}
			response.sendError(HttpServletResponse.SC_UNAUTHORIZED);
			return;
		}
		chain.doFilter(request, response);
	}
}
