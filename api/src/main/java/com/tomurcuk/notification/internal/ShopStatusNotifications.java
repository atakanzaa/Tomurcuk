package com.tomurcuk.notification.internal;

import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

import com.tomurcuk.identity.ShopUsers;
import com.tomurcuk.notification.NotificationLog;
import com.tomurcuk.notification.NotificationLog.Notification;
import com.tomurcuk.shop.ShopStatusChanged;
import org.springframework.modulith.events.ApplicationModuleListener;
import org.springframework.stereotype.Component;

/** Destek ekibi dükkânın durumunu değiştirince sahiplerine e-posta; çiçekçiye Tomurcuk konuşur. */
@Component
class ShopStatusNotifications {

	private static final DateTimeFormatter UNTIL = DateTimeFormatter.ofPattern("d MMMM HH:mm", Locale.forLanguageTag("tr"))
		.withZone(ZoneId.of("Europe/Istanbul"));

	private final NotificationLog notifications;

	private final ShopUsers users;

	ShopStatusNotifications(NotificationLog notifications, ShopUsers users) {
		this.notifications = notifications;
		this.users = users;
	}

	@ApplicationModuleListener
	void on(ShopStatusChanged event) {
		String reason = event.reason() == null || event.reason().isBlank() ? "" : "\nGerekçe: " + event.reason() + "\n";
		String subject;
		String body;
		switch (event.to()) {
			case PAUSED -> {
				subject = event.shopName() + " geçici olarak sipariş almıyor";
				String until = event.pausedUntil() == null ? "Yeniden açılınca size haber vereceğiz."
						: UNTIL.format(event.pausedUntil()) + " itibarıyla kendiliğinden yeniden sipariş alır.";
				body = """
						Tomurcuk destek ekibi %s vitrininde yeni siparişleri geçici olarak kapattı.
						%s
						%s Var olan siparişleriniz panelde duruyor; onları teslim etmeye devam edebilirsiniz.
						""".formatted(event.shopName(), reason, until);
			}
			case SUSPENDED -> {
				subject = event.shopName() + " askıya alındı";
				body = """
						Tomurcuk destek ekibi %s dükkânını askıya aldı. Vitrininiz sipariş almıyor; paneliniz açık ve var olan siparişleriniz orada.
						%s
						Konuyu konuşmak için bu e-postayı yanıtlayın ya da panelden destek talebi açın.
						""".formatted(event.shopName(), reason);
			}
			case CLOSED -> {
				subject = event.shopName() + " Tomurcuk'ta kapatıldı";
				body = """
						Tomurcuk destek ekibi %s dükkânını kalıcı olarak kapattı. Vitrininiz yayından kalktı ve panel girişi kapandı.
						%s
						Siparişlerinizin ve müşteri listenizin bir kopyası için bu e-postayı yanıtlayın.
						""".formatted(event.shopName(), reason);
			}
			default -> {
				subject = event.shopName() + " yeniden sipariş alıyor";
				body = """
						%s vitrini yeniden açıldı; alıcılar sipariş verebilir.
						""".formatted(event.shopName());
			}
		}
		for (String email : users.ownerEmails(event.shopId())) {
			notifications.send(new Notification(event.shopId(), null, null, "shop_status_email", "email", email, subject,
					body, event.eventId() + ":shop_status_email:" + email));
		}
	}
}
