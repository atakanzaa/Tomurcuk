package com.tomurcuk.notification.internal;

import java.util.List;

import com.tomurcuk.notification.SmsSender;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestClient;

/**
 * `tomurcuk.sms.provider=netgsm` ile açılır. Kullanıcı kodu, şifre ve onaylı mesaj başlığı
 * repoya değil ortamın secret'larına girer: TOMURCUK_SMS_NETGSM_USERCODE,
 * TOMURCUK_SMS_NETGSM_PASSWORD, TOMURCUK_SMS_NETGSM_HEADER. Staging'de
 * `tomurcuk.sms.allowed-recipients` tanımlıdır; SMS yalnızca o numaralara gider, boşsa hiç
 * kimseye.
 */
@Configuration(proxyBeanMethods = false)
@ConditionalOnProperty(name = "tomurcuk.sms.provider", havingValue = "netgsm")
class NetgsmConfig {

	@Bean
	SmsSender netgsmSmsSender(
			@Value("${tomurcuk.sms.netgsm.base-url:https://api.netgsm.com.tr}") String baseUrl,
			@Value("${tomurcuk.sms.netgsm.usercode}") String usercode,
			@Value("${tomurcuk.sms.netgsm.password}") String password,
			@Value("${tomurcuk.sms.netgsm.header}") String header,
			@Value("${tomurcuk.sms.allowed-recipients:#{null}}") List<String> allowedRecipients) {
		SmsSender netgsm = new NetgsmSmsSender(client(RestClient.builder(), baseUrl, usercode, password), header);
		return allowedRecipients == null ? netgsm : new AllowListSmsSender(netgsm, allowedRecipients);
	}

	static RestClient client(RestClient.Builder builder, String baseUrl, String usercode, String password) {
		return builder.baseUrl(baseUrl)
			.defaultHeaders(headers -> headers.setBasicAuth(usercode, password))
			.build();
	}
}
