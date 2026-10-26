package com.tomurcuk.notification.internal;

import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

import com.tomurcuk.notification.EmailSender;
import com.tomurcuk.notification.SmsSender.Result;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestClient;

/**
 * `tomurcuk.email.provider=resend` ile açılır. Anahtar repoya değil ortamın secret'larına girer:
 * TOMURCUK_EMAIL_RESEND_APIKEY. Gönderen adresin alan adı Resend'de doğrulanmış olmalı
 * (deploy/README.md). Staging'de `tomurcuk.email.allowed-recipients` tanımlıysa e-posta yalnızca
 * o adreslere gider; diğerleri gönderilmeden "iletilemedi" olarak kayda geçer, sebep destek
 * panelinde görünür.
 */
@Configuration(proxyBeanMethods = false)
@ConditionalOnProperty(name = "tomurcuk.email.provider", havingValue = "resend")
class ResendConfig {

	private static final Logger log = LoggerFactory.getLogger(ResendConfig.class);

	static final String NOT_ALLOWED = "Gönderilmedi: staging'de yalnızca TOMURCUK_EMAIL_ALLOWED_RECIPIENTS listesindeki adreslere gider";

	@Bean
	EmailSender resendEmailSender(@Value("${tomurcuk.email.resend.base-url:https://api.resend.com}") String baseUrl,
			@Value("${tomurcuk.email.resend.api-key}") String apiKey,
			@Value("${tomurcuk.email.from:Tomurcuk <siparis@tomurcuk.shop>}") String from,
			@Value("${tomurcuk.email.reply-to:}") String replyTo,
			@Value("${tomurcuk.email.allowed-recipients:#{null}}") List<String> allowedRecipients) {
		EmailSender resend = new ResendEmailSender(client(RestClient.builder(), baseUrl, apiKey), from, replyTo);
		if (allowedRecipients == null) {
			log.info("E-posta: Resend, gönderen {}, yanıt adresi {}", from, replyTo.isBlank() ? "yok" : replyTo);
			return resend;
		}
		Set<String> allowed = allowedRecipients.stream()
			.map(a -> a.strip().toLowerCase(Locale.ROOT))
			.filter(a -> !a.isEmpty())
			.collect(Collectors.toUnmodifiableSet());
		log.info("E-posta: Resend, gönderen {}, yalnızca {} izinli adrese", from, allowed.size());
		return allowListed(resend, allowed);
	}

	static EmailSender allowListed(EmailSender delegate, Set<String> allowed) {
		return (to, subject, text, html) -> allowed.contains(to.toLowerCase(Locale.ROOT))
				? delegate.send(to, subject, text, html) : new Result(false, NOT_ALLOWED, false);
	}

	static RestClient client(RestClient.Builder builder, String baseUrl, String apiKey) {
		return builder.baseUrl(baseUrl).defaultHeaders(headers -> headers.setBearerAuth(apiKey)).build();
	}
}
