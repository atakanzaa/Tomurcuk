package com.tomurcuk.notification.internal;

import com.tomurcuk.identity.PasswordLinkIssued;
import com.tomurcuk.notification.NotificationLog;
import com.tomurcuk.notification.NotificationLog.Notification;
import com.tomurcuk.shop.ShopDirectory;
import com.tomurcuk.shop.ShopInfo;
import org.springframework.modulith.events.ApplicationModuleListener;
import org.springframework.stereotype.Component;

/** Çiçekçi hesabı e-postaları; çiçekçiye Tomurcuk konuşur. */
@Component
class AccountNotifications {

	private final NotificationLog notifications;

	private final EmailTemplates templates;

	private final ShopDirectory shops;

	AccountNotifications(NotificationLog notifications, EmailTemplates templates, ShopDirectory shops) {
		this.notifications = notifications;
		this.templates = templates;
		this.shops = shops;
	}

	/**
	 * Şifre bağlantısı. Kurulum: destek ekibi dükkânı açınca ya da yeni bağlantı oluşturunca.
	 * Sıfırlama: kullanıcı giriş ekranından isteyince.
	 */
	@ApplicationModuleListener
	void on(PasswordLinkIssued event) {
		boolean reset = PasswordLinkIssued.RESET.equals(event.purpose());
		Email email = reset ? templates.passwordReset(event)
				: templates.passwordSetup(event, shops.find(event.shopId()).map(ShopInfo::slug).orElse(null));
		String kind = reset ? "password_reset_email" : "password_link_email";
		notifications.send(new Notification(event.shopId(), null, null, kind, "email", event.email(), email.subject(),
				email.text(), email.html(), event.linkId() + ":" + kind));
	}
}
