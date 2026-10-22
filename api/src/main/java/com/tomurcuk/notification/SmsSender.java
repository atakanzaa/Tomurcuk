package com.tomurcuk.notification;

/**
 * SMS sağlayıcısı (Netgsm, İleti Merkezi gibi). Yerelde ve önizlemede log'a yazan sürüm
 * çalışır; seçimi `tomurcuk.sms.provider` yapar. Telefon "0532 412 88 19" biçiminde gelir.
 */
public interface SmsSender {

	Result send(String phone, String text);

	/**
	 * `delivered` false ve `retryable` true ise bildirim yeniden denenir (sağlayıcı geçici
	 * hatası). Yanlış numara ya da tanımsız başlık gibi kalıcı hatalarda denenmez.
	 * `response` destek ekibine gösterilir.
	 */
	record Result(boolean delivered, String response, boolean retryable) {

		public Result(boolean delivered, String response) {
			this(delivered, response, true);
		}
	}
}
