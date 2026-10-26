package com.tomurcuk.notification.internal;

import com.tomurcuk.identity.ShopUsers;
import com.tomurcuk.notification.NotificationLog;
import com.tomurcuk.notification.NotificationLog.Notification;
import com.tomurcuk.shop.ShopDirectory;
import com.tomurcuk.shop.ShopInfo;
import com.tomurcuk.shop.ShopStatusChanged;
import org.springframework.modulith.events.ApplicationModuleListener;
import org.springframework.stereotype.Component;

/** Destek ekibi dükkânın durumunu değiştirince sahiplerine e-posta; çiçekçiye Tomurcuk konuşur. */
@Component
class ShopStatusNotifications {

	private final NotificationLog notifications;

	private final ShopUsers users;

	private final EmailTemplates templates;

	private final ShopDirectory shops;

	ShopStatusNotifications(NotificationLog notifications, ShopUsers users, EmailTemplates templates,
			ShopDirectory shops) {
		this.notifications = notifications;
		this.users = users;
		this.templates = templates;
		this.shops = shops;
	}

	@ApplicationModuleListener
	void on(ShopStatusChanged event) {
		Email email = templates.shopStatus(event, shops.find(event.shopId()).map(ShopInfo::slug).orElse(null));
		for (String to : users.ownerEmails(event.shopId())) {
			notifications.send(new Notification(event.shopId(), null, null, "shop_status_email", "email", to,
					email.subject(), email.text(), email.html(), event.eventId() + ":shop_status_email:" + to));
		}
	}
}
