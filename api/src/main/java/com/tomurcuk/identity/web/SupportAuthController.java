package com.tomurcuk.identity.web;

import java.util.List;
import java.util.Locale;

import com.tomurcuk.identity.PlatformPrincipal;
import com.tomurcuk.identity.PlatformRole;
import com.tomurcuk.identity.PlatformUsers;
import com.tomurcuk.identity.internal.SupportAuthentication;
import com.tomurcuk.shared.FieldError;
import com.tomurcuk.shared.ValidationException;
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
@RequestMapping("/api/support")
class SupportAuthController {

	private final SupportAuthentication authentication;

	private final PlatformUsers users;

	SupportAuthController(SupportAuthentication authentication, PlatformUsers users) {
		this.authentication = authentication;
		this.users = users;
	}

	/** E-posta, şifre ve doğrulama kodu birlikte; yanlışta hangisi olduğu söylenmez. */
	@PostMapping("/auth/login")
	SupportUser login(@RequestBody Login body, HttpServletRequest request, HttpServletResponse response) {
		String email = body.email() == null ? "" : body.email().strip().toLowerCase(Locale.ROOT);
		return authentication
			.login(email, body.password() == null ? "" : body.password(), body.code(), request, response)
			.map(SupportUser::of)
			.orElseThrow(() -> ValidationException.of("form", FieldError.of("credentials_invalid")));
	}

	@PostMapping("/auth/logout")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	void logout(HttpServletRequest request) {
		HttpSession session = request.getSession(false);
		if (session != null) {
			session.invalidate();
		}
	}

	@GetMapping("/me")
	SupportUser me(@AuthenticationPrincipal PlatformPrincipal user) {
		return SupportUser.of(user);
	}

	@GetMapping("/users")
	List<SupportUser> users() {
		return users.active().stream().map(SupportUser::of).toList();
	}

	record Login(String email, String password, String code) {
	}

	/** web/lib/api/types.ts `SupportUser` */
	record SupportUser(String id, String name, PlatformRole role) {

		static SupportUser of(PlatformPrincipal user) {
			return new SupportUser(user.userId(), user.name(), user.role());
		}
	}
}
