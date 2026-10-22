package com.tomurcuk.notification.internal;

import com.tomurcuk.identity.ImpersonationStarted;
import com.tomurcuk.identity.ShopUsers;
import com.tomurcuk.notification.NotificationLog;
import com.tomurcuk.notification.NotificationLog.Notification;
import org.springframework.modulith.events.ApplicationModuleListener;
import org.springframework.stereotype.Component;

/** Destek ekibi dükkân adına girince dükkân sahiplerine e-posta (docs/mvp.md "Destek paneli"). */
@Component
class ImpersonationNotifications {

	private final NotificationLog notifications;

	private final ShopUsers users;

	ImpersonationNotifications(NotificationLog notifications, ShopUsers users) {
		this.notifications = notifications;
		this.users = users;
	}

	@ApplicationModuleListener
	void on(ImpersonationStarted event) {
		String text = """
				Tomurcuk destek ekibinden %s panelinize girdi.

				Gerekçe: %s
				Oturum 30 dakika sürer; yapılan her işlem kayıt altındadır. Bu girişi siz istemediyseniz bu e-postayı yanıtlayın.
				""".formatted(event.supportUserName(), event.reason());
		for (String email : users.ownerEmails(event.shopId())) {
			notifications.send(new Notification(event.shopId(), null, null, "impersonation_email", "email", email,
					"Destek ekibi panelinize girdi", text, event.impersonationId() + ":impersonation_email:" + email));
		}
	}
}
