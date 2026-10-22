package com.tomurcuk.payment.internal;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import com.tomurcuk.payment.PaymentProvider;
import com.tomurcuk.shared.Ids;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

/**
 * Geliştirme ve önizleme için sağlayıcı. Ödeme sayfası frontend'deki deneme sayfasıdır
 * (dönüş adresinin yanında, `.../odeme/deneme`); sayfa iyzico gibi token'ı dönüş adresine POST
 * eder ve ödeme başarılı sayılır. Böylece gerçek akışın dönüş yolu aynen çalışır. Bilinmeyen
 * token'la dönüş başarısız ödemeyi dener.
 */
@Component
@ConditionalOnProperty(name = "tomurcuk.payment.provider", havingValue = "fake", matchIfMissing = true)
class FakePaymentProvider implements PaymentProvider {

	private final Map<String, Long> amounts = new ConcurrentHashMap<>();

	@Override
	public String name() {
		return "fake";
	}

	@Override
	public Session start(Request request) {
		String token = "fake_" + Ids.token(24);
		amounts.put(token, request.amount());
		String pageUrl = UriComponentsBuilder.fromUriString(request.callbackUrl().replaceFirst("/sonuc$", "/deneme"))
			.queryParam("token", token)
			.build()
			.toUriString();
		return new Session(token, pageUrl);
	}

	@Override
	public Result fetch(String token) {
		Long amount = amounts.get(token);
		if (amount == null) {
			// Uygulama yeniden başladıysa bellekteki tutar kaybolur; sahte sağlayıcıda ödeme yarıda kalmış sayılır.
			return new Result(Status.FAILED, null, 0, "{\"fake\":\"unknown token\"}");
		}
		return new Result(Status.SUCCEEDED, "fake-" + token.substring(5), amount, "{\"fake\":\"success\"}");
	}
}
