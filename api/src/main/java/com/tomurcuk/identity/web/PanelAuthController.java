package com.tomurcuk.identity.web;

import java.time.Clock;
import java.time.Instant;
import java.util.Locale;

import com.tomurcuk.identity.ShopPrincipal;
import com.tomurcuk.identity.internal.PanelAuthentication;
import com.tomurcuk.shared.FieldError;
import com.tomurcuk.shared.ValidationException;
import com.tomurcuk.shop.ShopDirectory;
import com.tomurcuk.shop.ShopView;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/panel")
class PanelAuthController {

	private final PanelAuthentication authentication;

	private final ShopDirectory shops;

	private final Clock clock;

	PanelAuthController(PanelAuthentication authentication, ShopDirectory shops, Clock clock) {
		this.authentication = authentication;
		this.shops = shops;
		this.clock = clock;
	}

	/**
	 * E-posta ve şifreyle giriş. Yanlış bilgide hangisinin yanlış olduğu söylenmez
	 * (`credentials_invalid`). Başarılı girişte oturum kimliği yenilenir.
	 */
	@PostMapping("/auth/login")
	PanelSession login(@RequestBody Login body, HttpServletRequest request, HttpServletResponse response) {
		String email = body.email() == null ? "" : body.email().strip().toLowerCase(Locale.ROOT);
		ShopPrincipal principal = authentication.login(email, body.password() == null ? "" : body.password(),
				request, response)
			.orElseThrow(() -> ValidationException.of("form", FieldError.of("credentials_invalid")));
		return session(principal, clock.instant());
	}

	@PostMapping("/auth/logout")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	void logout(HttpServletRequest request) {
		HttpSession session = request.getSession(false);
		if (session != null) {
			session.invalidate();
		}
	}

	/** web/lib/api/types.ts `PanelSession`. Dükkân adına oturum destek aşamasında gelir. */
	@GetMapping("/session")
	PanelSession session(@AuthenticationPrincipal ShopPrincipal principal) {
		return session(principal, authentication.lastSeen(principal.userId()).orElse(null));
	}

	private PanelSession session(ShopPrincipal principal, Instant lastSeenAt) {
		ShopView shop = shops.view(principal.shopId()).orElseThrow();
		return new PanelSession(shop, new User(principal.userId(), principal.shopId(), principal.name(),
				principal.email(), principal.role().code(), lastSeenAt), null);
	}

	record Login(String email, String password) {
	}

	record User(String id, String shopId, String name, String email, String role, Instant lastSeenAt) {
	}

	record PanelSession(ShopView shop, User user, Object impersonation) {
	}
}
