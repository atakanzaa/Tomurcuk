package com.tomurcuk.notification.internal;

import java.time.Clock;
import java.time.LocalDate;

import com.tomurcuk.identity.ShopUsers;
import com.tomurcuk.notification.NotificationLog;
import com.tomurcuk.notification.NotificationLog.Notification;
import com.tomurcuk.ordering.OrderConfirmed;
import com.tomurcuk.ordering.OrderNotice;
import com.tomurcuk.ordering.OrderStatusChanged;
import com.tomurcuk.shop.ShopDirectory;
import com.tomurcuk.shop.ShopInfo;
import com.tomurcuk.shop.ShopSettings;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.modulith.events.ApplicationModuleListener;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

/**
 * Sipariş olaylarından bildirim. Olaylar işlem tamamlandıktan sonra ayrı iş parçacığında ve
 * kalıcı olay kaydıyla işlenir: SMS sağlayıcısı çökse de sipariş akışı beklemez, uygulama
 * yeniden başlarsa yarım kalan olay yeniden işlenir (dedupe_key ikinci gönderimi engeller).
 */
@Component
class OrderNotifications {

	private final NotificationLog notifications;

	private final ShopDirectory shops;

	private final ShopUsers users;

	private final ShopSettings settings;

	private final Clock clock;

	private final String webUrl;

	OrderNotifications(NotificationLog notifications, ShopDirectory shops, ShopUsers users, ShopSettings settings,
			Clock clock, @Value("${tomurcuk.web-url}") String webUrl) {
		this.notifications = notifications;
		this.shops = shops;
		this.users = users;
		this.settings = settings;
		this.clock = clock;
		this.webUrl = webUrl;
	}

	/**
	 * Gönderene onay SMS'i (takip linkiyle), dükkân sahiplerine yeni sipariş e-postası; dükkân
	 * ayarlarında açıksa çiçekçinin cep telefonuna kısa SMS.
	 */
	@ApplicationModuleListener
	void on(OrderConfirmed event) {
		OrderNotice order = event.order();
		ShopInfo shop = shops.find(order.shopId()).orElseThrow();
		LocalDate today = LocalDate.now(clock.withZone(shop.timeZone()));
		String trackingUrl = url(shop.slug(), "takip", order.trackingToken());
		notifications.send(sms(order, "order_confirmed", order.senderPhone(),
				Messages.confirmed(shop, order, today, trackingUrl), "0"));
		String panelUrl = url("panel", "siparisler", order.orderId());
		for (String email : users.ownerEmails(order.shopId())) {
			notifications.send(new Notification(order.shopId(), order.orderId(), order.number(), "new_order_email",
					"email", email, Messages.newOrderSubject(order, today),
					Messages.newOrderBody(order, today, panelUrl), order.orderId() + ":new_order_email:" + email));
		}
		settings.newOrderSmsPhone(order.shopId())
			.ifPresent(phone -> notifications.send(
					sms(order, "new_order_sms", phone, Messages.newOrderSms(order, today, panelUrl), "0")));
	}

	/** Yolda: alıcıya. Teslim edildi: gönderene. Teslim edilemedi: ikisine. */
	@ApplicationModuleListener
	void on(OrderStatusChanged event) {
		OrderNotice order = event.order();
		ShopInfo shop = shops.find(order.shopId()).orElseThrow();
		String sequence = String.valueOf(event.sequence());
		switch (event.to()) {
			case ON_WAY -> notifications.send(
					sms(order, "order_on_way", order.recipientPhone(), Messages.onWay(shop, order), sequence));
			case DELIVERED -> notifications.send(sms(order, "order_delivered", order.senderPhone(),
					Messages.delivered(shop, order, url(shop.slug(), "takip", order.trackingToken())), sequence));
			case FAILED -> {
				notifications.send(sms(order, "order_failed", order.senderPhone(),
						Messages.failedToSender(shop, order), sequence));
				notifications.send(sms(order, "order_failed", order.recipientPhone(),
						Messages.failedToRecipient(shop), sequence));
			}
			default -> {
			}
		}
	}

	private static Notification sms(OrderNotice order, String kind, String phone, String text, String sequence) {
		return new Notification(order.shopId(), order.orderId(), order.number(), kind, "sms", phone, null, text,
				order.orderId() + ":" + kind + ":" + sequence + ":" + phone);
	}

	private String url(String... segments) {
		return UriComponentsBuilder.fromUriString(webUrl).pathSegment(segments).build().toUriString();
	}
}
