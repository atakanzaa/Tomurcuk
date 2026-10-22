package com.tomurcuk.payment.internal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.content;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.header;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

import java.util.Optional;

import com.tomurcuk.payment.PaymentProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;
import tools.jackson.databind.json.JsonMapper;

/**
 * iyzico hesabına bağlanmadan istek biçimi, IYZWSv2 imzası ve yanıtların yorumu. Gerçek
 * sandbox denemesi ayrıca yapılır (docs/backend.md).
 */
class IyzicoPaymentProviderTests {

	MockRestServiceServer server;

	IyzicoPaymentProvider provider;

	@BeforeEach
	void setUp() {
		RestClient.Builder builder = RestClient.builder().baseUrl("https://sandbox-api.iyzipay.com");
		server = MockRestServiceServer.bindTo(builder).build();
		provider = new IyzicoPaymentProvider(builder.build(), JsonMapper.builder().build(), "api-anahtari",
				"gizli-anahtar", "siparis@ornek.com", shopId -> Optional.of("SUBKEY"), () -> "123456789");
	}

	@Test
	void startsCheckoutFormWithSignedRequest() {
		server.expect(requestTo("https://sandbox-api.iyzipay.com" + IyzicoPaymentProvider.INITIALIZE))
			.andExpect(method(HttpMethod.POST))
			.andExpect(header("x-iyzi-rnd", "123456789"))
			.andExpect(request -> {
				String body = request.getBody().toString();
				assertThat(request.getHeaders().getFirst("Authorization"))
					.isEqualTo(provider.authorization("123456789", IyzicoPaymentProvider.INITIALIZE, body))
					.startsWith("IYZWSv2 ");
			})
			.andExpect(content().json("""
					{"locale":"tr","conversationId":"o_1","price":"1370.00","paidPrice":"1370.00","currency":"TRY",
					 "paymentGroup":"PRODUCT","callbackUrl":"https://ornek.com/nergis/siparis/odeme/sonuc",
					 "enabledInstallments":[1],
					 "buyer":{"name":"Ayşe ve","surname":"Can","gsmNumber":"+905332074165","email":"siparis@ornek.com",
					          "identityNumber":"11111111111","ip":"85.34.78.112","city":"Caferağa, Kadıköy"},
					 "basketItems":[{"id":"o_1","price":"1370.00","itemType":"PHYSICAL","subMerchantKey":"SUBKEY",
					                 "subMerchantPrice":"1370.00"}]}
					"""))
			.andRespond(withSuccess("""
					{"status":"success","token":"tok-1","paymentPageUrl":"https://sandbox-cpp.iyzipay.com?token=tok-1"}
					""", MediaType.APPLICATION_JSON));

		PaymentProvider.Session session = provider.start(new PaymentProvider.Request("o_1", "shop_nergis", 137000,
				"Nergis Çiçek Atölyesi siparişi T-4830", "https://ornek.com/nergis/siparis/odeme/sonuc",
				new PaymentProvider.Buyer("cu_ayse", "Ayşe ve Can", "0533 207 41 65", "Moda Cad. No: 12",
						"Caferağa, Kadıköy", "85.34.78.112")));

		assertThat(session.token()).isEqualTo("tok-1");
		assertThat(session.pageUrl()).isEqualTo("https://sandbox-cpp.iyzipay.com?token=tok-1");
		server.verify();
	}

	@Test
	void failedInitializeMeansPaymentUnavailable() {
		server.expect(requestTo("https://sandbox-api.iyzipay.com" + IyzicoPaymentProvider.INITIALIZE))
			.andRespond(withSuccess("{\"status\":\"failure\",\"errorCode\":\"1001\",\"errorMessage\":\"api bilgileri bulunamadı\"}",
					MediaType.APPLICATION_JSON));
		assertThatThrownBy(() -> provider.start(new PaymentProvider.Request("o_1", "shop_nergis", 100, "x",
				"https://ornek.com/cb", new PaymentProvider.Buyer("c", "", "0533 207 41 65", "a", "b", "127.0.0.1"))))
			.isInstanceOf(PaymentProvider.Unavailable.class)
			.hasMessageContaining("1001");
	}

	@Test
	void retrieveMapsPaymentStatus() {
		server.expect(requestTo("https://sandbox-api.iyzipay.com" + IyzicoPaymentProvider.RETRIEVE))
			.andRespond(withSuccess("{\"status\":\"success\",\"paymentStatus\":\"SUCCESS\",\"paymentId\":\"2273\",\"paidPrice\":\"1370.0\"}",
					MediaType.APPLICATION_JSON));
		server.expect(requestTo("https://sandbox-api.iyzipay.com" + IyzicoPaymentProvider.RETRIEVE))
			.andRespond(withSuccess("{\"status\":\"success\",\"paymentStatus\":\"FAILURE\"}", MediaType.APPLICATION_JSON));
		server.expect(requestTo("https://sandbox-api.iyzipay.com" + IyzicoPaymentProvider.RETRIEVE))
			.andRespond(withSuccess("{\"status\":\"success\"}", MediaType.APPLICATION_JSON));

		PaymentProvider.Result paid = provider.fetch("tok-1");
		assertThat(paid.status()).isEqualTo(PaymentProvider.Status.SUCCEEDED);
		assertThat(paid.paidAmount()).isEqualTo(137000);
		assertThat(paid.providerRef()).isEqualTo("2273");
		assertThat(provider.fetch("tok-2").status()).isEqualTo(PaymentProvider.Status.FAILED);
		assertThat(provider.fetch("tok-3").status()).isEqualTo(PaymentProvider.Status.PENDING);
	}
}
