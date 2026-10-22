package com.tomurcuk.identity.internal;

import com.tomurcuk.audit.AuditLog;
import com.tomurcuk.identity.Impersonations;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.crypto.factory.PasswordEncoderFactories;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.access.intercept.AuthorizationFilter;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.session.web.http.CookieSerializer;
import org.springframework.session.web.http.DefaultCookieSerializer;

/**
 * API'yi tarayıcı değil Next sunucusu çağırır; Next oturum cookie'sini iletir. Bu yüzden
 * form girişi ve yönlendirme yoktur: oturumsuz istek 401, yetkisiz işlem 403 döner. Panel
 * uçları dükkân oturumu (SHOP), destek uçları platform oturumu (PLATFORM) ister; destek ekibi
 * panele yalnızca dükkân adına oturumla girer (ImpersonationFilter). CSRF
 * koruması Next tarafındadır (Server Action'lar köken kontrolü yapar); API iç ağdadır.
 */
@Configuration(proxyBeanMethods = false)
class SecurityConfig {

	static final String SESSION_COOKIE = "TOMURCUK_SESSION";

	@Bean
	SecurityFilterChain api(HttpSecurity http, SecurityContextRepository contexts, Impersonations impersonations,
			AuditLog audit) throws Exception {
		return http
			.authorizeHttpRequests(requests -> requests
				.requestMatchers("/api/public/**", "/actuator/health/**", "/v3/api-docs/**", "/api/panel/auth/login",
						"/api/support/auth/login")
				.permitAll()
				.requestMatchers("/api/panel/**")
				.hasAuthority(Authorities.SHOP)
				.requestMatchers("/api/support/**")
				.hasAuthority(Authorities.PLATFORM)
				.anyRequest()
				.denyAll())
			.addFilterBefore(new ImpersonationFilter(impersonations, audit), AuthorizationFilter.class)
			.securityContext(context -> context.securityContextRepository(contexts))
			.csrf(AbstractHttpConfigurer::disable)
			.formLogin(AbstractHttpConfigurer::disable)
			.httpBasic(AbstractHttpConfigurer::disable)
			.logout(AbstractHttpConfigurer::disable)
			.requestCache(AbstractHttpConfigurer::disable)
			.exceptionHandling(errors -> errors.authenticationEntryPoint(new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED)))
			.build();
	}

	@Bean
	SecurityContextRepository securityContextRepository() {
		return new HttpSessionSecurityContextRepository();
	}

	/**
	 * Panel oturumunun cookie'si. Tarayıcı bu cookie'yi görmez: Next sunucusu değeri kendi
	 * httpOnly cookie'sinde saklar ve API'ye iletir.
	 */
	@Bean
	CookieSerializer cookieSerializer() {
		DefaultCookieSerializer serializer = new DefaultCookieSerializer();
		serializer.setCookieName(SESSION_COOKIE);
		serializer.setCookiePath("/");
		serializer.setUseHttpOnlyCookie(true);
		serializer.setSameSite("Strict");
		return serializer;
	}

	@Bean
	PasswordEncoder passwordEncoder() {
		return PasswordEncoderFactories.createDelegatingPasswordEncoder();
	}
}
