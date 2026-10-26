package com.tomurcuk.notification;

import java.time.Clock;

import com.tomurcuk.notification.internal.Email;
import com.tomurcuk.notification.internal.EmailTemplates;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/**
 * Destek panelinden deneme e-postası: e-posta ayarlarının (sağlayıcı, alan adı, anahtar, staging
 * izinli adresleri) çalıştığını görmek için. Bildirim kaydına yazılmaz, yeniden denenmez;
 * sağlayıcının yanıtı hemen döner.
 */
@Service
public class EmailCheck {

	private final EmailSender sender;

	private final EmailTemplates templates;

	private final Clock clock;

	private final String provider;

	EmailCheck(EmailSender sender, EmailTemplates templates, Clock clock,
			@Value("${tomurcuk.email.provider:log}") String provider) {
		this.sender = sender;
		this.templates = templates;
		this.clock = clock;
		this.provider = provider;
	}

	/** Sağlayıcı `log` ise e-posta yalnızca log'a yazılır; bu gönderilmedi sayılır. */
	public Result send(String to, String name) {
		Email email = templates.test(name, clock.instant());
		SmsSender.Result result = sender.send(to, email.subject(), email.text(), email.html());
		if (!"resend".equals(provider)) {
			return new Result(to, false,
					"E-posta sağlayıcısı kapalı (tomurcuk.email.provider=" + provider
							+ "); e-posta yalnızca log'a yazıldı. Sunucudaki .env'e TOMURCUK_EMAIL_PROVIDER=resend girin.");
		}
		return new Result(to, result.delivered(), result.response());
	}

	/** `response`: sağlayıcının yanıtı ya da neden gönderilmediği. */
	public record Result(String to, boolean delivered, String response) {
	}
}
