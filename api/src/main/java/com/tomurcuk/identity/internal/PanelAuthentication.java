package com.tomurcuk.identity.internal;

import java.time.Clock;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import com.tomurcuk.identity.ShopPrincipal;
import com.tomurcuk.shared.FieldError;
import com.tomurcuk.shared.ValidationException;
import com.tomurcuk.shop.ShopDirectory;
import com.tomurcuk.shop.ShopInfo;
import com.tomurcuk.shop.ShopStatus;
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

@Service
public class PanelAuthentication {

	/** Kullanıcı yoksa da şifre karşılaştırılır; yanıt süresi e-postanın kayıtlı olup olmadığını ele vermez. */
	private static final String DUMMY_HASH = "{bcrypt}$2a$10$37i3/8ZTj8VoEmVe8Md.rOT.NH9z1rkPsc3ouAUJUHa0mC4ga7vS2";

	private final ShopUserStore users;

	private final PasswordEncoder passwords;

	private final SecurityContextRepository contexts;

	private final Clock clock;

	private final ShopDirectory shops;

	PanelAuthentication(ShopUserStore users, PasswordEncoder passwords, SecurityContextRepository contexts,
			Clock clock, ShopDirectory shops) {
		this.users = users;
		this.passwords = passwords;
		this.contexts = contexts;
		this.clock = clock;
		this.shops = shops;
	}

	public Optional<ShopPrincipal> login(String email, String password, HttpServletRequest request,
			HttpServletResponse response) {
		Optional<ShopUserStore.ShopUser> user = users.findActiveByEmail(email);
		boolean matches = passwords.matches(password, user.map(ShopUserStore.ShopUser::passwordHash).orElse(DUMMY_HASH));
		if (user.isEmpty() || !matches) {
			return Optional.empty();
		}
		ShopUserStore.ShopUser u = user.get();
		// Kalıcı kapatılan dükkân panele giremez; doğru şifreden sonra söylenir.
		if (shops.find(u.shopId()).map(ShopInfo::status).orElse(ShopStatus.CLOSED) == ShopStatus.CLOSED) {
			throw ValidationException.of("form", FieldError.of("shop_closed"));
		}
		ShopPrincipal principal = new ShopPrincipal(u.id(), u.shopId(), u.name(), u.email(), u.role());
		UsernamePasswordAuthenticationToken token = UsernamePasswordAuthenticationToken.authenticated(principal, null,
				authorities(principal));

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

	/** Oturum türü (SHOP) ve rolün izinleri. */
	static List<GrantedAuthority> authorities(ShopPrincipal principal) {
		List<GrantedAuthority> authorities = new ArrayList<>();
		authorities.add(new SimpleGrantedAuthority(Authorities.SHOP));
		principal.role().permissions().forEach(p -> authorities.add(new SimpleGrantedAuthority(p.name())));
		return authorities;
	}

	public Optional<Instant> lastSeen(String userId) {
		return users.lastSeen(userId);
	}
}
