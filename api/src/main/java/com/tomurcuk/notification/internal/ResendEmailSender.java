package com.tomurcuk.notification.internal;

import java.util.List;

import com.tomurcuk.notification.EmailSender;
import com.tomurcuk.notification.SmsSender.Result;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

/**
 * Resend (`POST /emails`, Bearer anahtar). 200 yanıtındaki `id` kayda yazılır. Hız sınırı (429)
 * ve sunucu hataları yeniden denenir; anahtar, gönderen alan adı ya da adres hatası (4xx) denenmez.
 */
class ResendEmailSender implements EmailSender {

	private final RestClient http;

	private final String from;

	ResendEmailSender(RestClient http, String from) {
		this.http = http;
		this.from = from;
	}

	@Override
	public Result send(String to, String subject, String text) {
		Response response;
		try {
			response = http.post()
				.uri("/emails")
				.contentType(MediaType.APPLICATION_JSON)
				.body(new Request(from, List.of(to), subject, text))
				.exchange((request, res) -> {
					HttpStatusCode status = res.getStatusCode();
					Body body = res.bodyTo(Body.class);
					return new Response(status.value(), body == null ? null : body.id(),
							body == null ? null : body.message());
				});
		}
		catch (RestClientException ex) {
			return new Result(false, "Resend'e ulaşılamadı: " + ex.getMessage(), true);
		}
		if (response == null) {
			return new Result(false, "Resend boş yanıt döndü", true);
		}
		if (response.status() == 200) {
			return new Result(true, "id " + response.id(), false);
		}
		boolean retryable = response.status() == 429 || response.status() >= 500;
		return new Result(false, "Resend " + response.status() + ": "
				+ (response.message() == null ? "bilinmeyen hata" : response.message()), retryable);
	}

	record Request(String from, List<String> to, String subject, String text) {
	}

	/** Gövdede `id` (başarı) ya da `message` (hata). */
	record Body(String id, String message) {
	}

	private record Response(int status, String id, String message) {
	}
}
