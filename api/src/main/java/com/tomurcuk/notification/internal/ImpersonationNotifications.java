package com.tomurcuk.notification.internal;

import java.time.Clock;

import com.tomurcuk.identity.ImpersonationStarted;
import com.tomurcuk.identity.ShopUsers;
import com.tomurcuk.notification.NotificationLog;
import com.tomurcuk.notification.NotificationLog.Notification;
import com.tomurcuk.shop.ShopDirectory;
import com.tomurcuk.shop.ShopInfo;
import org.springframework.modulith.events.ApplicationModuleListener;
import org.springframework.stereotype.Component;

/** Destek ekibi dükkân adına girince dükkân sahiplerine e-posta (docs/mvp.md "Destek paneli"). */
@Component
class ImpersonationNotifications {

	private final NotificationLog notifications;

	private final ShopUsers users;

	private final EmailTemplates templates;

	private final ShopDirectory shops;

	private final Clock clock;

	ImpersonationNotifications(NotificationLog notifications, ShopUsers users, EmailTemplates templates,
			ShopDirectory shops, Clock clock) {
		this.notifications = notifications;
		this.users = users;
		this.templates = templates;
		this.shops = shops;
		this.clock = clock;
	}

	/** Olay oturum açılınca hemen işlenir; e-postadaki saat işlendiği andır. */
	@ApplicationModuleListener
	void on(ImpersonationStarted event) {
		String shopName = shops.find(event.shopId()).map(ShopInfo::name).orElse("Dükkânınız");
		Email email = templates.impersonation(event, shopName, clock.instant());
		for (String to : users.ownerEmails(event.shopId())) {
			notifications.send(new Notification(event.shopId(), null, null, "impersonation_email", "email", to,
					email.subject(), email.text(), email.html(), event.impersonationId() + ":impersonation_email:" + to));
		}
	}
}
