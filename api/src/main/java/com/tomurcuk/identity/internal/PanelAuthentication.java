package com.tomurcuk.identity.internal;

import java.time.Clock;
import java.time.Instant;
import java.util.Optional;

import com.tomurcuk.identity.ShopPrincipal;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.stereotype.Service;

@Service
public class PanelAuthentication {

	/** Kullanıcı yoksa da şifre karşılaştırılır; yanıt süresi e-postanın kayıtlı olup olmadığını ele vermez. */
	private static final String DUMMY_HASH = "{bcrypt}$2a$10$37i3/8ZTj8VoEmVe8Md.rOT.NH9z1rkPsc3ouAUJUHa0mC4ga7vS2";

	private final ShopUserStore users;

	private final PasswordEncoder passwords;

	private final SecurityContextRepository contexts;

	private final Clock clock;

	PanelAuthentication(ShopUserStore users, PasswordEncoder passwords, SecurityContextRepository contexts,
			Clock clock) {
		this.users = users;
		this.passwords = passwords;
		this.contexts = contexts;
		this.clock = clock;
	}

	public Optional<ShopPrincipal> login(String email, String password, HttpServletRequest request,
			HttpServletResponse response) {
		Optional<ShopUserStore.ShopUser> user = users.findActiveByEmail(email);
		boolean matches = passwords.matches(password, user.map(ShopUserStore.ShopUser::passwordHash).orElse(DUMMY_HASH));
		if (user.isEmpty() || !matches) {
			return Optional.empty();
		}
		ShopUserStore.ShopUser u = user.get();
		ShopPrincipal principal = new ShopPrincipal(u.id(), u.shopId(), u.name(), u.email(), u.role());
		UsernamePasswordAuthenticationToken token = UsernamePasswordAuthenticationToken.authenticated(principal, null,
				principal.role().permissions().stream().map(p -> new SimpleGrantedAuthority(p.name())).toList());

		// Oturum sabitleme saldırısına karşı girişte oturum kimliği yenilenir.
		if (request.getSession(false) != null) {
			request.changeSessionId();
		}
		SecurityContext context = SecurityContextHolder.createEmptyContext();
		context.setAuthentication(token);
		SecurityContextHolder.setContext(context);
		contexts.saveContext(context, request, response);
		users.touch(u.id(), clock.instant());
		return Optional.of(principal);
	}

	public Optional<Instant> lastSeen(String userId) {
		return users.lastSeen(userId);
	}
}
