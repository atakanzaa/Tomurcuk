package com.tomurcuk.payment;

/**
 * Ödeme sağlayıcısı. Prod'da iyzico (Checkout Form, pazaryeri), geliştirmede sahte sağlayıcı;
 * seçimi `tomurcuk.payment.provider` yapar. Kart bilgisi sisteme hiç girmez: alıcı
 * sağlayıcının sayfasında öder, sağlayıcı alıcıyı `callbackUrl`'e token'la geri gönderir.
 */
public interface PaymentProvider {

	String name();

	Session start(Request request);

	/** Token'ın son durumunu sağlayıcıdan sorar; callback'te ve zamanlanmış sorguda kullanılır. */
	Result fetch(String token);

	/**
	 * Tutar kuruş. `conversationId` siparişin id'sidir. Sepet tek satırdır (ürün ve teslimat
	 * toplamı); sağlayıcı satır toplamının tutara eşit olmasını ister.
	 */
	record Request(String conversationId, String shopId, long amount, String description, String callbackUrl,
			Buyer buyer) {
	}

	/**
	 * Ödeyen kişi: gönderen. Sağlayıcı ad, telefon, adres, şehir ve IP ister; alıcı üye olmadan
	 * sipariş verdiği için e-posta ve kimlik numarası alınmaz.
	 */
	record Buyer(String id, String name, String phone, String address, String city, String ip) {
	}

	/** Ödeme sayfası açılamadı (sağlayıcı hatası, yapılandırma eksik). */
	class Unavailable extends RuntimeException {

		public Unavailable(String message) {
			super(message);
		}
	}

	record Session(String token, String pageUrl) {
	}

	enum Status {

		SUCCEEDED, FAILED, PENDING

	}

	/** `providerRef` sağlayıcının ödeme numarasıdır; tekil tutulur. */
	record Result(Status status, String providerRef, long paidAmount, String rawResponse) {
	}
}
