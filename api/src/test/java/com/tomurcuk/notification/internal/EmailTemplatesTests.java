package com.tomurcuk.notification.internal;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.Map;

import com.tomurcuk.identity.ImpersonationStarted;
import com.tomurcuk.identity.PasswordLinkIssued;
import com.tomurcuk.ordering.OrderNotice;
import com.tomurcuk.ordering.PaymentMethod;
import com.tomurcuk.shop.ShopStatus;
import com.tomurcuk.shop.ShopStatusChanged;
import org.junit.jupiter.api.Test;

/**
 * E-posta şablonları: kullanıcı girdisi kaçışlanır, her e-postada logo, düz metin karşılığı ve
 * eylem bağlantısı bulunur, ünlem yoktur. Önizlemeler target/email-previews/ altına yazılır.
 */
class EmailTemplatesTests {

	private static final Instant AT = Instant.parse("2026-10-22T09:30:00Z");

	private final EmailTemplates templates = new EmailTemplates(new Emails("https://tomurcuk.shop", ""));

	private final EmailTemplates withReply = new EmailTemplates(
			new Emails("https://tomurcuk.shop", "destek@tomurcuk.shop"));

	private final OrderNotice order = new OrderNotice("o_4821", "shop_nergis", "T-4821", LocalDate.parse("2026-10-22"),
			"13:00", "16:00", null, "Elif Yılmaz", "0532 412 88 19", "0533 207 41 65", "Ayşe", false, "a3Fq9ZmLx2VbN8cR",
			"Caferağa, Kadıköy", "Mevsim buketi (M), vazo", 125000, "İyi ki doğdun, nice yaşlara.", PaymentMethod.CARD);

	private Map<String, Email> all() {
		PasswordLinkIssued setup = new PasswordLinkIssued("l1", "shop_nergis", "Ayla Kaya", "ayla@nergiscicek.com",
				"Nergis Çiçek Atölyesi", "tok3n", PasswordLinkIssued.SETUP);
		PasswordLinkIssued reset = new PasswordLinkIssued("l2", "shop_nergis", "Ayla Kaya", "ayla@nergiscicek.com",
				"Nergis Çiçek Atölyesi", "tok3n", PasswordLinkIssued.RESET);
		Map<String, Email> emails = new LinkedHashMap<>();
		emails.put("1-dukkan-acildi", templates.passwordSetup(setup, "nergis"));
		emails.put("2-sifre-yenile", templates.passwordReset(reset));
		emails.put("3-yeni-siparis", templates.newOrder(order, "Nergis Çiçek Atölyesi", LocalDate.parse("2026-10-22")));
		emails.put("4-gecici-kapali", withReply.shopStatus(status(ShopStatus.PAUSED, "Tadilat; sahibi aradı.",
				Instant.parse("2026-10-22T15:00:00Z")), "nergis"));
		emails.put("5-askida", withReply.shopStatus(status(ShopStatus.SUSPENDED, "Üç teslimat şikâyeti.", null), "nergis"));
		emails.put("6-kapatildi", withReply.shopStatus(status(ShopStatus.CLOSED, "Dükkân kapandı.", null), "nergis"));
		emails.put("7-yeniden-acildi", templates.shopStatus(status(ShopStatus.OPEN, "", null), "nergis"));
		emails.put("8-destek-girdi", templates.impersonation(
				new ImpersonationStarted("i1", "shop_nergis", "Selin Karaca", "Talep: Teslim bölgesi eklenemiyor"),
				"Nergis Çiçek Atölyesi", AT));
		emails.put("9-deneme", templates.test("Derya Kaya", AT));
		return emails;
	}

	private static ShopStatusChanged status(ShopStatus to, String reason, Instant until) {
		return new ShopStatusChanged("e1", "shop_nergis", "Nergis Çiçek Atölyesi", ShopStatus.OPEN, to, reason, until);
	}

	@Test
	void everyEmailHasLogoTextAndNoExclamation() throws IOException {
		Path dir = Path.of("target", "email-previews");
		Files.createDirectories(dir);
		all().forEach((name, email) -> {
			assertThat(email.html()).as(name).contains("cid:logo").contains("<html lang=\"tr\">");
			assertThat(email.text()).as(name).isNotBlank().doesNotContain("<").doesNotContain("!");
			assertThat(email.subject()).as(name).doesNotContain("!");
			try {
				// Tarayıcıda önizleme için logo dosyadan okunur.
				Files.writeString(dir.resolve(name + ".html"),
						email.html().replace("cid:logo", "../classes/email/logo.png"));
			}
			catch (IOException ex) {
				throw new IllegalStateException(ex);
			}
		});
	}

	@Test
	void linksAndFactsAreConcrete() {
		Map<String, Email> emails = all();
		assertThat(emails.get("1-dukkan-acildi").html()).contains("https://tomurcuk.shop/sifre/tok3n")
			.contains("https://tomurcuk.shop/nergis")
			.contains("Şifremi belirle");
		assertThat(emails.get("1-dukkan-acildi").text()).contains("Şifremi belirle: https://tomurcuk.shop/sifre/tok3n");
		assertThat(emails.get("3-yeni-siparis").subject()).isEqualTo("Yeni sipariş T-4821: bugün 13:00–16:00");
		assertThat(emails.get("3-yeni-siparis").text()).contains("Teslim: Bugün, 13:00–16:00")
			.contains("Tutar: 1.250 TL")
			.contains("Kart notu: İyi ki doğdun")
			.contains("https://tomurcuk.shop/panel/siparisler/o_4821");
		assertThat(emails.get("4-gecici-kapali").text()).contains("Gerekçe: Tadilat")
			.contains("22 Ekim 18:00")
			.contains("Bu e-postayı yanıtlayın");
		assertThat(emails.get("7-yeniden-acildi").html()).doesNotContain("Not</p>");
	}

	@Test
	void userInputIsEscaped() {
		PasswordLinkIssued event = new PasswordLinkIssued("l1", "s", "<b>Ayla</b>", "a@b.c", "<script>x</script>",
				"t", PasswordLinkIssued.SETUP);
		Email email = templates.passwordSetup(event, null);
		assertThat(email.html()).doesNotContain("<script>").contains("&lt;script&gt;").doesNotContain("<b>Ayla");
		assertThat(email.html()).doesNotContain("Vitrininiz");
	}
}
