package com.tomurcuk.notification.internal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.content;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.header;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withStatus;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

import com.tomurcuk.notification.SmsSender;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

/** Resend hesabı olmadan istek biçimi ve yanıt kodlarının yorumu. */
class ResendEmailSenderTests {

	MockRestServiceServer server;

	ResendEmailSender sender;

	@BeforeEach
	void setUp() {
		RestClient.Builder builder = RestClient.builder();
		server = MockRestServiceServer.bindTo(builder).build();
		sender = new ResendEmailSender(ResendConfig.client(builder, "https://api.resend.com", "re_test"),
				"Tomurcuk <siparis@tomurcuk.shop>");
	}

	@Test
	void sendsBearerKeyAndPlainText() {
		server.expect(requestTo("https://api.resend.com/emails"))
			.andExpect(method(HttpMethod.POST))
			.andExpect(header("Authorization", "Bearer re_test"))
			.andExpect(content().json("""
					{"from":"Tomurcuk <siparis@tomurcuk.shop>","to":["ayla@nergiscicek.com"],
					 "subject":"Yeni sipariş T-4821","text":"Ürün: Mevsim buketi"}
					"""))
			.andRespond(withSuccess("{\"id\":\"49a3999c-0ce1-4ea6-ab68-afcd6dc2e794\"}", MediaType.APPLICATION_JSON));

		SmsSender.Result result = sender.send("ayla@nergiscicek.com", "Yeni sipariş T-4821", "Ürün: Mevsim buketi");

		assertThat(result.delivered()).isTrue();
		assertThat(result.response()).isEqualTo("id 49a3999c-0ce1-4ea6-ab68-afcd6dc2e794");
		server.verify();
	}

	/** Doğrulanmamış alan adı kalıcı hatadır, yeniden denenmez; hız sınırı denenir. */
	@Test
	void permanentAndTemporaryErrors() {
		server.expect(requestTo("https://api.resend.com/emails"))
			.andRespond(withStatus(HttpStatus.FORBIDDEN).contentType(MediaType.APPLICATION_JSON)
				.body("{\"statusCode\":403,\"name\":\"validation_error\",\"message\":\"The tomurcuk.shop domain is not verified.\"}"));
		server.expect(requestTo("https://api.resend.com/emails"))
			.andRespond(withStatus(HttpStatus.TOO_MANY_REQUESTS).contentType(MediaType.APPLICATION_JSON)
				.body("{\"statusCode\":429,\"name\":\"rate_limit_exceeded\",\"message\":\"Too many requests\"}"));

		SmsSender.Result domain = sender.send("ayla@nergiscicek.com", "konu", "metin");
		SmsSender.Result rate = sender.send("ayla@nergiscicek.com", "konu", "metin");

		assertThat(domain.delivered()).isFalse();
		assertThat(domain.retryable()).isFalse();
		assertThat(domain.response()).isEqualTo("Resend 403: The tomurcuk.shop domain is not verified.");
		assertThat(rate.delivered()).isFalse();
		assertThat(rate.retryable()).isTrue();
	}
}
