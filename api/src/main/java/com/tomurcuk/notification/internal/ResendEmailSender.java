package com.tomurcuk.notification.internal;

import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.util.Base64;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.tomurcuk.notification.EmailSender;
import com.tomurcuk.notification.SmsSender.Result;
import org.springframework.core.io.ClassPathResource;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

/**
 * Resend (`POST /emails`, Bearer anahtar). Düz metin ve HTML birlikte gider; HTML logoyu
 * `cid:logo` ile istiyorsa logo satır içi ek olarak eklenir (`content_id`). 200 yanıtındaki `id`
 * kayda yazılır. Hız sınırı (429) ve sunucu hataları yeniden denenir; anahtar, gönderen alan adı
 * ya da adres hatası (4xx) denenmez.
 */
class ResendEmailSender implements EmailSender {

	private static final String LOGO = base64("email/logo.png");

	private final RestClient http;

	private final String from;

	private final String replyTo;

	ResendEmailSender(RestClient http, String from, String replyTo) {
		this.http = http;
		this.from = from;
		this.replyTo = replyTo == null || replyTo.isBlank() ? null : replyTo.strip();
	}

	@Override
	public Result send(String to, String subject, String text, String html) {
		List<Attachment> attachments = html != null && html.contains("cid:" + EmailLayout.LOGO_CID)
				? List.of(new Attachment("logo.png", LOGO, "image/png", EmailLayout.LOGO_CID)) : null;
		Response response;
		try {
			response = http.post()
				.uri("/emails")
				.contentType(MediaType.APPLICATION_JSON)
				.body(new Request(from, List.of(to), subject, text, html, replyTo, attachments))
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

	private static String base64(String path) {
		try (InputStream in = new ClassPathResource(path).getInputStream()) {
			return Base64.getEncoder().encodeToString(in.readAllBytes());
		}
		catch (IOException ex) {
			throw new UncheckedIOException(ex);
		}
	}

	@JsonInclude(JsonInclude.Include.NON_NULL)
	record Request(String from, List<String> to, String subject, String text, String html,
			@JsonProperty("reply_to") String replyTo, List<Attachment> attachments) {
	}

	/** Satır içi ek: HTML'de `cid:<content_id>` ile gösterilir. */
	record Attachment(String filename, String content, @JsonProperty("content_type") String contentType,
			@JsonProperty("content_id") String contentId) {
	}

	/** Gövdede `id` (başarı) ya da `message` (hata). */
	record Body(String id, String message) {
	}

	private record Response(int status, String id, String message) {
	}
}
