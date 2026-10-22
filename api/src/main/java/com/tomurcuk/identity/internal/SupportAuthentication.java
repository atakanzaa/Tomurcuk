package com.tomurcuk.identity.internal;

import java.time.Clock;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import com.tomurcuk.identity.PlatformPrincipal;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.stereotype.Service;

/**
 * Destek ekibinin girişi: e-posta, şifre ve iki adımlı doğrulama kodu (TOTP) birlikte. Üçünden
 * biri yanlışsa hangisi olduğu söylenmez.
 */
@Service
public class SupportAuthentication {

	private static final String DUMMY_HASH = "{bcrypt}$2a$10$37i3/8ZTj8VoEmVe8Md.rOT.NH9z1rkPsc3ouAUJUHa0mC4ga7vS2";

	private final PlatformUserStore users;

	private final PasswordEncoder passwords;

	private final SecurityContextRepository contexts;

	private final Clock clock;

	SupportAuthentication(PlatformUserStore users, PasswordEncoder passwords, SecurityContextRepository contexts,
			Clock clock) {
		this.users = users;
		this.passwords = passwords;
		this.contexts = contexts;
		this.clock = clock;
	}

	public Optional<PlatformPrincipal> login(String email, String password, String code, HttpServletRequest request,
			HttpServletResponse response) {
		Optional<PlatformUserStore.PlatformUser> user = users.findActiveByEmail(email);
		boolean passwordOk = passwords.matches(password,
				user.map(PlatformUserStore.PlatformUser::passwordHash).orElse(DUMMY_HASH));
		boolean codeOk = user.isPresent() && Totp.verify(user.get().totpSecret(), code, clock.instant());
		if (user.isEmpty() || !passwordOk || !codeOk) {
			return Optional.empty();
		}
		PlatformUserStore.PlatformUser u = user.get();
		PlatformPrincipal principal = new PlatformPrincipal(u.id(), u.name(), u.email(), u.role());
		List<GrantedAuthority> authorities = new ArrayList<>();
		authorities.add(new SimpleGrantedAuthority(Authorities.PLATFORM));
		principal.role().permissions().forEach(p -> authorities.add(new SimpleGrantedAuthority(p.name())));
		if (request.getSession(false) != null) {
			request.changeSessionId();
		}
		SecurityContext context = SecurityContextHolder.createEmptyContext();
		context.setAuthentication(UsernamePasswordAuthenticationToken.authenticated(principal, null, authorities));
		SecurityContextHolder.setContext(context);
		contexts.saveContext(context, request, response);
		users.touch(u.id(), clock.instant());
		return Optional.of(principal);
	}
}
