package com.tomurcuk.notification.internal;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

/**
 * E-postalardaki ortak parçalar: sitenin adresleri, destek ekibine nasıl ulaşılacağı ve alt
 * bilgi. Yanıt adresi (`tomurcuk.email.reply-to`) tanımlıysa e-postayı yanıtlamak destek ekibine
 * gider; tanımsızsa metinler panelden talep açmayı söyler.
 */
@Component
class Emails {

	private final String webUrl;

	private final String replyTo;

	Emails(@Value("${tomurcuk.web-url}") String webUrl, @Value("${tomurcuk.email.reply-to:}") String replyTo) {
		this.webUrl = webUrl;
		this.replyTo = replyTo.strip();
	}

	String url(String... segments) {
		return UriComponentsBuilder.fromUriString(webUrl).pathSegment(segments).build().toUriString();
	}

	/** "Bu e-postayı yanıtlayın ya da panelden destek talebi açın." */
	String contact() {
		return replyTo.isEmpty() ? "Panelden destek talebi açın; Tomurcuk ekibi size döner."
				: "Bu e-postayı yanıtlayın ya da panelden destek talebi açın.";
	}

	/** Panel girişi kapalıyken (dükkân kalıcı kapatıldı) tek yol yanıt adresi. */
	String contactWithoutPanel() {
		return replyTo.isEmpty() ? "Tomurcuk destek ekibi sizi arayacak."
				: "Bu e-postayı yanıtlayın; Tomurcuk destek ekibi size döner. Adres: " + replyTo;
	}

	/** Dükkân hesabına giden e-postaların altı. */
	EmailLayout forShop(String subject, String shopName) {
		return EmailLayout.email(subject)
			.footer("Bu e-postayı Tomurcuk'taki " + shopName + " hesabınız için aldınız.")
			.footer("Tomurcuk, küçük çiçekçilerin sipariş sayfası, paneli ve müşteri defteri.");
	}
}
