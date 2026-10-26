package com.tomurcuk.notification.internal;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;

import com.tomurcuk.identity.ImpersonationStarted;
import com.tomurcuk.identity.PasswordLinkIssued;
import com.tomurcuk.notification.internal.EmailLayout.Fact;
import com.tomurcuk.ordering.OrderNotice;
import com.tomurcuk.ordering.PaymentMethod;
import com.tomurcuk.shared.Money;
import com.tomurcuk.shop.ShopStatusChanged;
import org.springframework.stereotype.Component;

/**
 * Tomurcuk'un e-postaları. Çiçekçiye Tomurcuk konuşur, "siz" hitabıyla; ünlem ve emoji yok.
 * Her e-posta somut bilgiyle başlar ve tek bir eyleme çağırır.
 */
@Component
public class EmailTemplates {

	private static final ZoneId ISTANBUL = ZoneId.of("Europe/Istanbul");

	private static final DateTimeFormatter DAY_TIME = DateTimeFormatter.ofPattern("d MMMM HH:mm", Locale.forLanguageTag("tr"))
		.withZone(ISTANBUL);

	private final Emails emails;

	EmailTemplates(Emails emails) {
		this.emails = emails;
	}

	/** Destek ekibi dükkânı açtı ya da yeni bağlantı oluşturdu; bağlantı 7 gün geçerli. */
	Email passwordSetup(PasswordLinkIssued event, String shopSlug) {
		String setUrl = emails.url("sifre", event.token());
		return emails.forShop(event.shopName() + " Tomurcuk'ta açıldı: şifrenizi belirleyin", event.shopName())
			.preheader("Şifrenizi belirleyin, panelinize girin ve ilk ürününüzü ekleyin.")
			.title("Dükkânınız açıldı")
			.paragraph("Merhaba " + event.name() + ",")
			.paragraph(event.shopName()
					+ " için Tomurcuk paneliniz hazır. Şifrenizi belirleyince panele girer, ürünlerinizi ve teslim bölgelerinizi eklersiniz; vitrininiz sipariş almaya başlar.")
			.button("Şifremi belirle", setUrl)
			.facts(List.of(Fact.link("Vitrininiz", shopSlug == null ? null : emails.url(shopSlug)),
					Fact.link("Panel girişi", emails.url("giris")), Fact.of("Giriş e-postanız", event.email())))
			.note("Bağlantı 7 gün geçerlidir ve bir kez kullanılır. Süresi geçerse Tomurcuk destek ekibinden yenisini isteyin.")
			.build();
	}

	/** Giriş ekranından istendi; bağlantı 1 saat geçerli. */
	Email passwordReset(PasswordLinkIssued event) {
		return emails.forShop("Tomurcuk şifrenizi yenileyin", event.shopName())
			.preheader("Bağlantı 1 saat geçerli.")
			.title("Şifrenizi yenileyin")
			.paragraph("Merhaba " + event.name() + ",")
			.paragraph(event.shopName() + " paneli için şifre yenileme istendi. Yeni şifrenizi bu bağlantıdan belirleyin.")
			.button("Şifremi yenile", emails.url("sifre", event.token()))
			.note("Bağlantı 1 saat geçerlidir ve bir kez kullanılır. Bu isteği siz yapmadıysanız bu e-postayı yok sayın; şifreniz değişmez.")
			.build();
	}

	/** Dükkân sahiplerine; SMS'i olmayan sahip de siparişi buradan görür. */
	Email newOrder(OrderNotice order, String shopName, LocalDate today) {
		String day = Messages.day(order.deliveryDate(), today);
		String when = day.substring(0, 1).toUpperCase(Locale.forLanguageTag("tr")) + day.substring(1) + ", "
				+ (order.deliveryTime() != null && !order.deliveryTime().isBlank() ? "saat " + order.deliveryTime()
						: order.slotStart() + "–" + order.slotEnd());
		return emails.forShop(Messages.newOrderSubject(order, today), shopName)
			.preheader(order.itemsSummary() + ", " + when + ", " + order.zoneName())
			.title("Yeni sipariş " + order.number())
			.paragraph("Vitrininizden yeni bir sipariş geldi. Hazırlamaya başlayınca panelde \"Hazırlanıyor\" olarak işaretleyin; gönderene SMS gider.")
			.facts(List.of(Fact.of("Ürün", order.itemsSummary()), Fact.of("Teslim", when),
					Fact.of("Bölge", order.zoneName()), Fact.of("Alıcı", order.recipientName()),
					Fact.of("Tutar", Money.format(order.total())), Fact.of("Ödeme", payment(order.paymentMethod()))))
			.quote("Kart notu", order.cardNote())
			.button("Siparişi aç", emails.url("panel", "siparisler", order.orderId()))
			.build();
	}

	Email shopStatus(ShopStatusChanged event, String shopSlug) {
		EmailLayout email;
		switch (event.to()) {
			case PAUSED -> {
				String until = event.pausedUntil() == null ? "Yeniden açılınca size e-postayla haber vereceğiz."
						: DAY_TIME.format(event.pausedUntil()) + " itibarıyla kendiliğinden yeniden sipariş alır.";
				email = emails.forShop(event.shopName() + " geçici olarak sipariş almıyor", event.shopName())
					.preheader(until)
					.title("Siparişleriniz geçici olarak kapatıldı")
					.paragraph("Tomurcuk destek ekibi " + event.shopName()
							+ " vitrininde yeni siparişleri geçici olarak kapattı. Vitrininiz açık; alıcılar ürünlerinizi görür ama sipariş veremez.")
					.quote("Gerekçe", event.reason())
					.facts(List.of(Fact.of("Yeniden açılış", event.pausedUntil() == null ? "Destek ekibi açınca"
							: DAY_TIME.format(event.pausedUntil()) + ", kendiliğinden")))
					.paragraph("Var olan siparişleriniz panelde duruyor; onları teslim etmeye devam edin.")
					.button("Panele git", emails.url("panel"))
					.note(emails.contact());
			}
			case SUSPENDED -> email = emails.forShop(event.shopName() + " askıya alındı", event.shopName())
				.preheader("Vitrininiz sipariş almıyor; paneliniz açık.")
				.title("Dükkânınız askıya alındı")
				.paragraph("Tomurcuk destek ekibi " + event.shopName()
						+ " dükkânını askıya aldı. Vitrininiz sipariş almıyor; paneliniz açık ve var olan siparişleriniz orada.")
				.quote("Gerekçe", event.reason())
				.paragraph("Konuyu konuşmak için destek talebi açın; Tomurcuk ekibi size döner.")
				.button("Destek talebi aç", emails.url("panel", "yardim"))
				.note(emails.contact());
			case CLOSED -> email = emails.forShop(event.shopName() + " Tomurcuk'ta kapatıldı", event.shopName())
				.preheader("Vitrininiz yayından kalktı, panel girişi kapandı.")
				.title("Dükkânınız kapatıldı")
				.paragraph("Tomurcuk destek ekibi " + event.shopName()
						+ " dükkânını kalıcı olarak kapattı. Vitrininiz yayından kalktı ve panel girişi kapandı. Verileriniz silinmedi.")
				.quote("Gerekçe", event.reason())
				.paragraph("Siparişlerinizin ve müşteri listenizin bir kopyasını isteyebilirsiniz.")
				.note(emails.contactWithoutPanel());
			default -> email = emails.forShop(event.shopName() + " yeniden sipariş alıyor", event.shopName())
				.preheader("Alıcılar yeniden sipariş verebilir.")
				.title("Vitrininiz yeniden açıldı")
				.paragraph(event.shopName()
						+ " vitrini yeniden sipariş alıyor ve alıcı ana sayfasında listeleniyor.")
				.quote("Not", event.reason())
				.button("Vitrini aç", shopSlug == null ? emails.url("panel") : emails.url(shopSlug));
		}
		return email.build();
	}

	Email impersonation(ImpersonationStarted event, String shopName, Instant at) {
		return emails.forShop("Destek ekibi panelinize girdi", shopName)
			.preheader(event.supportUserName() + ", " + DAY_TIME.format(at))
			.title("Destek ekibi panelinize girdi")
			.paragraph("Tomurcuk destek ekibinden biri " + shopName
					+ " paneline sizin adınıza girdi. Oturum 30 dakika sürer; yapılan her işlem kayıt altındadır.")
			.facts(List.of(Fact.of("Kim", event.supportUserName()), Fact.of("Ne zaman", DAY_TIME.format(at)),
					Fact.of("Süre", "30 dakika")))
			.quote("Gerekçe", event.reason())
			.note("Bu girişi siz istemediyseniz bize haber verin. " + emails.contact())
			.build();
	}

	/** Destek panelinden: Resend ayarlarının çalıştığını görmek için. */
	public Email test(String name, Instant at) {
		return EmailLayout.email("Tomurcuk deneme e-postası")
			.preheader("E-posta ayarları çalışıyor.")
			.title("E-posta ayarları çalışıyor")
			.paragraph("Merhaba " + name + ",")
			.paragraph("Bu e-postayı destek panelinden istediniz. Görüyorsanız gönderen alan adı, anahtar ve izinli adres listesi doğru; dükkânlara giden e-postalar da bu görünümle gider.")
			.facts(List.of(Fact.of("Gönderim zamanı", DAY_TIME.format(at))))
			.button("Destek paneline git", emails.url("destek"))
			.footer("Tomurcuk destek ekibi için gönderildi.")
			.build();
	}

	private static String payment(PaymentMethod method) {
		if (method == null) {
			return null;
		}
		return switch (method) {
			case CARD -> "Kartla ödendi";
			case TRANSFER -> "Havale, ödeme bekleniyor";
			case CASH -> "Kapıda nakit";
		};
	}
}
