package com.tomurcuk.notification.internal;

import com.tomurcuk.identity.PasswordLinkIssued;
import com.tomurcuk.notification.NotificationLog;
import com.tomurcuk.notification.NotificationLog.Notification;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.modulith.events.ApplicationModuleListener;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

/** Çiçekçi hesabı e-postaları; çiçekçiye Tomurcuk konuşur. */
@Component
class AccountNotifications {

	private final NotificationLog notifications;

	private final String webUrl;

	AccountNotifications(NotificationLog notifications, @Value("${tomurcuk.web-url}") String webUrl) {
		this.notifications = notifications;
		this.webUrl = webUrl;
	}

	/**
	 * Şifre bağlantısı. Kurulum: destek ekibi dükkânı açınca ya da yeni bağlantı oluşturunca.
	 * Sıfırlama: kullanıcı giriş ekranından isteyince.
	 */
	@ApplicationModuleListener
	void on(PasswordLinkIssued event) {
		String url = UriComponentsBuilder.fromUriString(webUrl).pathSegment("sifre", event.token()).build().toUriString();
		String login = UriComponentsBuilder.fromUriString(webUrl).pathSegment("giris").build().toUriString();
		boolean reset = PasswordLinkIssued.RESET.equals(event.purpose());
		String text = reset ? """
				Merhaba %s,

				%s paneli için şifre yenileme istendi. Şifrenizi yenilemek için bu bağlantıyı açın:
				%s

				Bağlantı 1 saat geçerlidir ve bir kez kullanılır. Bu isteği siz yapmadıysanız bu e-postayı yok sayın; şifreniz değişmez.
				""".formatted(event.name(), event.shopName(), url) : """
				Merhaba %s,

				%s için Tomurcuk paneliniz hazır. Şifrenizi belirlemek için bu bağlantıyı açın:
				%s

				Bağlantı 7 gün geçerlidir ve bir kez kullanılır. Süresi geçerse Tomurcuk destek ekibinden yenisini isteyin.

				Panele giriş: %s
				E-postanız: %s
				""".formatted(event.name(), event.shopName(), url, login, event.email());
		String kind = reset ? "password_reset_email" : "password_link_email";
		notifications.send(new Notification(event.shopId(), null, null, kind, "email", event.email(),
				reset ? "Tomurcuk şifrenizi yenileyin" : "Tomurcuk panelinize şifre belirleyin", text,
				event.linkId() + ":" + kind));
	}
}
