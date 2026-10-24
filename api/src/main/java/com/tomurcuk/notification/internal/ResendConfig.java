package com.tomurcuk.notification.internal;

import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

import com.tomurcuk.notification.EmailSender;
import com.tomurcuk.notification.SmsSender.Result;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestClient;

/**
 * `tomurcuk.email.provider=resend` ile açılır. Anahtar repoya değil ortamın secret'larına girer:
 * TOMURCUK_EMAIL_RESEND_APIKEY. Gönderen adresin alan adı Resend'de doğrulanmış olmalı
 * (deploy/README.md). Staging'de `tomurcuk.email.allowed-recipients` tanımlıysa e-posta yalnızca
 * o adreslere gider.
 */
@Configuration(proxyBeanMethods = false)
@ConditionalOnProperty(name = "tomurcuk.email.provider", havingValue = "resend")
class ResendConfig {

	@Bean
	EmailSender resendEmailSender(@Value("${tomurcuk.email.resend.base-url:https://api.resend.com}") String baseUrl,
			@Value("${tomurcuk.email.resend.api-key}") String apiKey,
			@Value("${tomurcuk.email.from:Tomurcuk <siparis@tomurcuk.shop>}") String from,
			@Value("${tomurcuk.email.allowed-recipients:#{null}}") List<String> allowedRecipients) {
		EmailSender resend = new ResendEmailSender(client(RestClient.builder(), baseUrl, apiKey), from);
		if (allowedRecipients == null) {
			return resend;
		}
		Set<String> allowed = allowedRecipients.stream()
			.map(a -> a.strip().toLowerCase(Locale.ROOT))
			.collect(Collectors.toUnmodifiableSet());
		return (to, subject, text) -> allowed.contains(to.toLowerCase(Locale.ROOT)) ? resend.send(to, subject, text)
				: new Result(true, "Gönderilmedi: ekip adresi değil", false);
	}

	static RestClient client(RestClient.Builder builder, String baseUrl, String apiKey) {
		return builder.baseUrl(baseUrl).defaultHeaders(headers -> headers.setBearerAuth(apiKey)).build();
	}
}
