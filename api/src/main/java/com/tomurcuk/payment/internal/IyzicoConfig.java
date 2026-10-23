package com.tomurcuk.payment.internal;

import java.time.Duration;
import java.util.Optional;
import java.util.UUID;

import com.tomurcuk.payment.PaymentProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.web.client.RestClient;
import tools.jackson.databind.json.JsonMapper;

/**
 * `tomurcuk.payment.provider=iyzico` ile açılır. Anahtarlar repoya değil ortamın secret'larına
 * girer: TOMURCUK_PAYMENT_IYZICO_APIKEY, TOMURCUK_PAYMENT_IYZICO_SECRETKEY. Adres sandbox'ta
 * https://sandbox-api.iyzipay.com, prod'da https://api.iyzipay.com.
 */
@Configuration(proxyBeanMethods = false)
@ConditionalOnProperty(name = "tomurcuk.payment.provider", havingValue = "iyzico")
class IyzicoConfig {

	@Bean
	PaymentProvider iyzicoPaymentProvider(JsonMapper json, JdbcClient jdbc,
			@Value("${tomurcuk.payment.iyzico.base-url:https://sandbox-api.iyzipay.com}") String baseUrl,
			@Value("${tomurcuk.payment.iyzico.api-key}") String apiKey,
			@Value("${tomurcuk.payment.iyzico.secret-key}") String secretKey,
			@Value("${tomurcuk.payment.iyzico.buyer-email}") String buyerEmail,
			@Value("${tomurcuk.payment.iyzico.marketplace:false}") boolean marketplace) {
		SubMerchants subMerchants = marketplace ? shopId -> jdbc
			.sql("SELECT iyzico_sub_merchant_key FROM shop_payment_account WHERE shop_id = :shopId")
			.param("shopId", shopId)
			.query(String.class)
			.optional()
			.or(() -> {
				throw new PaymentProvider.Unavailable("Dükkânın iyzico alt üye işyeri anahtarı yok: " + shopId);
			}) : shopId -> Optional.empty();
		return new IyzicoPaymentProvider(client(baseUrl), json, apiKey, secretKey,
				buyerEmail, subMerchants, () -> System.currentTimeMillis() + UUID.randomUUID().toString().substring(0, 8));
	}

	/**
	 * HttpURLConnection, curl'ün gönderdiğine en yakın istek: HTTP/1.1, sıkıştırma istemez. JDK
	 * HttpClient'la (HTTP/2, gzip, "Java-http-client" kimliği) iyzico sandbox'ı boş gövde döndü.
	 */
	static RestClient client(String baseUrl) {
		SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
		factory.setConnectTimeout(Duration.ofSeconds(10));
		factory.setReadTimeout(Duration.ofSeconds(30));
		return RestClient.builder()
			.baseUrl(baseUrl)
			.requestFactory(factory)
			.defaultHeader(HttpHeaders.ACCEPT, MediaType.APPLICATION_JSON_VALUE)
			.defaultHeader(HttpHeaders.USER_AGENT, "Tomurcuk")
			.build();
	}
}
