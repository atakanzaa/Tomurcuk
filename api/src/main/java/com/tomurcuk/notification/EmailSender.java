package com.tomurcuk.notification;

/** E-posta gönderimi; yerelde log'a yazan sürüm, seçimi `tomurcuk.email.provider` yapar. */
public interface EmailSender {

	SmsSender.Result send(String to, String subject, String text);
}
