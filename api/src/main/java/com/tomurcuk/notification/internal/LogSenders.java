package com.tomurcuk.notification.internal;

import com.tomurcuk.notification.EmailSender;
import com.tomurcuk.notification.SmsSender;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/** Yerel geliştirme ve önizleme: SMS ve e-posta gönderilmez, log'a yazılır. */
@Configuration(proxyBeanMethods = false)
class LogSenders {

	private static final Logger log = LoggerFactory.getLogger(LogSenders.class);

	@Bean
	@ConditionalOnProperty(name = "tomurcuk.sms.provider", havingValue = "log", matchIfMissing = true)
	SmsSender logSmsSender() {
		return (phone, text) -> {
			log.info("SMS {} ← {}", phone, text);
			return new SmsSender.Result(true, null);
		};
	}

	@Bean
	@ConditionalOnProperty(name = "tomurcuk.email.provider", havingValue = "log", matchIfMissing = true)
	EmailSender logEmailSender() {
		log.info("E-posta: gönderilmez, log'a yazılır (tomurcuk.email.provider=log)");
		return (to, subject, text, html) -> {
			log.info("E-posta {} ← {}\n{}", to, subject, text);
			return new SmsSender.Result(true, null);
		};
	}
}
