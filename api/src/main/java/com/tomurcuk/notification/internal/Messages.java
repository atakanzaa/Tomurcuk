package com.tomurcuk.notification.internal;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

import com.tomurcuk.ordering.OrderNotice;
import com.tomurcuk.shared.Money;
import com.tomurcuk.shop.ShopInfo;

/**
 * Bildirim metinleri. Alıcıya ve gönderene dükkân konuşur, dükkân adı başta yazılır. Ünlem
 * ve emoji yok; saat 24 saat, aralık en dash ile. İsimsiz gönderimde alıcıya giden metinde
 * gönderen hiç geçmez.
 */
final class Messages {

	private static final DateTimeFormatter DAY_MONTH = DateTimeFormatter.ofPattern("d MMMM", Locale.forLanguageTag("tr"));

	private Messages() {
	}

	/** Gönderene: sipariş alındı ve takip linki. */
	static String confirmed(ShopInfo shop, OrderNotice order, LocalDate today, String trackingUrl) {
		return "%s: Siparişiniz alındı. %s, %s %s arasında teslim edilecek. Takip: %s".formatted(shop.name(),
				order.number(), day(order.deliveryDate(), today), range(order), trackingUrl);
	}

	/** Alıcıya: gönderi yolda. */
	static String onWay(ShopInfo shop, OrderNotice order) {
		String when = order.deliveryTime() != null ? "Saat " + order.deliveryTime() + " civarında"
				: range(order) + " arasında";
		return "%s: Size bir gönderi yolda. %s teslim edilecek.".formatted(shop.name(), when);
	}

	/** Gönderene: teslim edildi. */
	static String delivered(ShopInfo shop, OrderNotice order) {
		String time = order.deliveryTime() == null ? "" : ", saat " + order.deliveryTime();
		return "%s: %s teslim edildi. Alıcı: %s%s.".formatted(shop.name(), order.number(), order.recipientName(), time);
	}

	/** Gönderene: teslim edilemedi. */
	static String failedToSender(ShopInfo shop, OrderNotice order) {
		return "%s: %s teslim edilemedi, alıcıya ulaşamadık. Sizi arayıp yeni bir teslim saati belirleyeceğiz."
			.formatted(shop.name(), order.number());
	}

	/** Alıcıya: teslim edilemedi. */
	static String failedToRecipient(ShopInfo shop) {
		return "%s: Size gelen gönderiyi teslim edemedik. Sizi arayıp yeni bir teslim saati belirleyeceğiz."
			.formatted(shop.name());
	}

	static String newOrderSubject(OrderNotice order, LocalDate today) {
		return "Yeni sipariş %s: %s %s".formatted(order.number(), day(order.deliveryDate(), today), range(order));
	}

	/** Dükkân sahibine yeni sipariş e-postası; çiçekçiye Tomurcuk konuşur. */
	static String newOrderBody(OrderNotice order, LocalDate today, String panelUrl) {
		return """
				Yeni sipariş %s

				Ürün: %s
				Teslim: %s %s, %s
				Alıcı: %s
				Tutar: %s

				Siparişi görmek için: %s
				""".formatted(order.number(), order.itemsSummary(), day(order.deliveryDate(), today), range(order),
				order.zoneName(), order.recipientName(), Money.format(order.total()), panelUrl);
	}

	/** "bugün", "yarın" ya da "14 Şubat". */
	static String day(LocalDate date, LocalDate today) {
		if (date.equals(today)) {
			return "bugün";
		}
		if (date.equals(today.plusDays(1))) {
			return "yarın";
		}
		return date.format(DAY_MONTH);
	}

	private static String range(OrderNotice order) {
		return order.slotStart() + "–" + order.slotEnd();
	}
}
