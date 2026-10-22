package com.tomurcuk.notification.internal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.content;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.header;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withStatus;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

import java.util.List;

import com.tomurcuk.notification.SmsSender;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

/** Netgsm hesabı olmadan istek biçimi ve yanıt kodlarının yorumu. */
class NetgsmSmsSenderTests {

	MockRestServiceServer server;

	NetgsmSmsSender sender;

	@BeforeEach
	void setUp() {
		RestClient.Builder builder = RestClient.builder();
		server = MockRestServiceServer.bindTo(builder).build();
		sender = new NetgsmSmsSender(NetgsmConfig.client(builder, "https://api.netgsm.com.tr", "8502220000", "sifre"),
				"NERGISCICEK");
	}

	@Test
	void sendsBasicAuthAndTenDigitNumber() {
		server.expect(requestTo("https://api.netgsm.com.tr/sms/rest/v2/send"))
			.andExpect(method(HttpMethod.POST))
			.andExpect(header("Authorization", "Basic ODUwMjIyMDAwMDpzaWZyZQ=="))
			.andExpect(content().json("""
					{"msgheader":"NERGISCICEK","encoding":"TR","iysfilter":"0",
					 "messages":[{"msg":"Siparişiniz alındı.","no":"5324128819"}]}
					"""))
			.andRespond(withSuccess("{\"code\":\"00\",\"jobid\":\"17377215342605050417149344\",\"description\":\"queued\"}",
					MediaType.APPLICATION_JSON));

		SmsSender.Result result = sender.send("0532 412 88 19", "Siparişiniz alındı.");

		assertThat(result.delivered()).isTrue();
		assertThat(result.response()).isEqualTo("jobid 17377215342605050417149344");
		server.verify();
	}

	/** Tanımsız başlık kalıcı hatadır, yeniden denenmez; sistem hatası denenir. */
	@Test
	void permanentAndTemporaryErrors() {
		server.expect(requestTo("https://api.netgsm.com.tr/sms/rest/v2/send"))
			.andRespond(withStatus(HttpStatus.NOT_ACCEPTABLE).contentType(MediaType.APPLICATION_JSON)
				.body("{\"code\":\"40\",\"description\":\"header\"}"));
		server.expect(requestTo("https://api.netgsm.com.tr/sms/rest/v2/send"))
			.andRespond(withSuccess("{\"code\":\"100\"}", MediaType.APPLICATION_JSON));

		SmsSender.Result header = sender.send("0532 412 88 19", "metin");
		SmsSender.Result system = sender.send("0532 412 88 19", "metin");

		assertThat(header.delivered()).isFalse();
		assertThat(header.retryable()).isFalse();
		assertThat(header.response()).isEqualTo("Netgsm kod 40: mesaj başlığı tanımlı değil");
		assertThat(system.delivered()).isFalse();
		assertThat(system.retryable()).isTrue();
	}

	/** Staging: yalnızca ekip numaralarına gönderilir; diğerleri Netgsm'e hiç gitmez. */
	@Test
	void stagingSendsOnlyToTeamNumbers() {
		server.expect(requestTo("https://api.netgsm.com.tr/sms/rest/v2/send"))
			.andExpect(content().json("{\"messages\":[{\"no\":\"5324128819\"}]}"))
			.andRespond(withSuccess("{\"code\":\"00\",\"jobid\":\"1\"}", MediaType.APPLICATION_JSON));
		SmsSender staging = new AllowListSmsSender(sender, List.of("05324128819"));

		SmsSender.Result team = staging.send("0532 412 88 19", "metin");
		SmsSender.Result other = staging.send("0555 000 11 22", "metin");

		assertThat(team.response()).isEqualTo("jobid 1");
		assertThat(other.delivered()).isTrue();
		assertThat(other.response()).isEqualTo("Gönderilmedi: ekip numarası değil");
		server.verify();
	}
}
