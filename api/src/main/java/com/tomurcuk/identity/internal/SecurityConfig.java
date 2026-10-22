package com.tomurcuk.identity.internal;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.crypto.factory.PasswordEncoderFactories;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.session.web.http.CookieSerializer;
import org.springframework.session.web.http.DefaultCookieSerializer;

/**
 * API'yi tarayıcı değil Next sunucusu çağırır; Next oturum cookie'sini iletir. Bu yüzden
 * form girişi ve yönlendirme yoktur: oturumsuz istek 401, yetkisiz işlem 403 döner. CSRF
 * koruması Next tarafındadır (Server Action'lar köken kontrolü yapar); API iç ağdadır.
 */
@Configuration(proxyBeanMethods = false)
class SecurityConfig {

	static final String SESSION_COOKIE = "TOMURCUK_SESSION";

	@Bean
	SecurityFilterChain api(HttpSecurity http, SecurityContextRepository contexts) throws Exception {
		return http
			.authorizeHttpRequests(requests -> requests
				.requestMatchers("/api/public/**", "/actuator/health/**", "/v3/api-docs/**", "/api/panel/auth/login")
				.permitAll()
				.requestMatchers("/api/panel/**")
				.authenticated()
				.anyRequest()
				.denyAll())
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
