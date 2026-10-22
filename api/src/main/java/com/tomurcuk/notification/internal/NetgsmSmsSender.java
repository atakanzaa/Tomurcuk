package com.tomurcuk.notification.internal;

import java.util.List;
import java.util.Map;
import java.util.Set;

import com.tomurcuk.notification.SmsSender;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

/**
 * Netgsm REST v2 (`POST /sms/rest/v2/send`, Basic auth). Yanıttaki `code` "00" ise SMS
 * kuyruğa alınmıştır; `jobid` rapor sorgusu için kayda yazılır. Netgsm sonucu 200 ve 406
 * yanıtlarında gövdede döner.
 *
 * <p>
 * Mesajlarımız işlem (bilgilendirme) mesajıdır, İYS iznine tabi değildir; pazarlama mesajı bu
 * yoldan gönderilmez.
 */
class NetgsmSmsSender implements SmsSender {

	/** Tekrar denemekle düzelmeyen hatalar: metin, kimlik, başlık, İYS, parametre. */
	private static final Set<String> PERMANENT = Set.of("20", "30", "40", "41", "50", "51", "70");

	private static final Map<String, String> MEANINGS = Map.of("20", "mesaj metni hatalı ya da çok uzun", "30",
			"kullanıcı adı, şifre ya da API izni hatalı", "40", "mesaj başlığı tanımlı değil", "41",
			"mesaj başlığı tanımlı değil", "50", "İYS kontrollü gönderim yapılamıyor", "51",
			"İYS kontrollü gönderim yapılamıyor", "70", "parametre hatalı ya da eksik", "85",
			"aynı numaraya kısa sürede çok fazla gönderim", "100", "Netgsm sistem hatası");

	private final RestClient http;

	private final String header;

	NetgsmSmsSender(RestClient http, String header) {
		this.http = http;
		this.header = header;
	}

	@Override
	public Result send(String phone, String text) {
		Request body = new Request(header, "TR", "0", List.of(new Message(text, digits(phone))));
		Response response;
		try {
			response = http.post()
				.uri("/sms/rest/v2/send")
				.contentType(MediaType.APPLICATION_JSON)
				.body(body)
				.exchange((request, res) -> {
					HttpStatusCode status = res.getStatusCode();
					if (status.value() != 200 && status.value() != 406) {
						return new Response("http-" + status.value(), null, null);
					}
					return res.bodyTo(Response.class);
				});
		}
		catch (RestClientException ex) {
			return new Result(false, "Netgsm'e ulaşılamadı: " + ex.getMessage(), true);
		}
		if (response == null) {
			return new Result(false, "Netgsm boş yanıt döndü", true);
		}
		if ("00".equals(response.code())) {
			return new Result(true, "jobid " + response.jobid(), false);
		}
		String meaning = MEANINGS.getOrDefault(response.code(),
				response.description() == null ? "bilinmeyen hata" : response.description());
		return new Result(false, "Netgsm kod " + response.code() + ": " + meaning, !PERMANENT.contains(response.code()));
	}

	/** "0532 412 88 19" → "5324128819" */
	static String digits(String phone) {
		String digits = phone.replaceAll("\\D", "");
		return digits.startsWith("0") ? digits.substring(1) : digits;
	}

	/** `iysfilter` "0": bilgilendirme mesajı, İYS kontrolü yapılmaz. */
	record Request(String msgheader, String encoding, String iysfilter, List<Message> messages) {
	}

	record Message(String msg, String no) {
	}

	record Response(String code, String jobid, String description) {
	}
}
