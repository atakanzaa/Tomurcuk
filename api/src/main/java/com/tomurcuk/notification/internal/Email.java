package com.tomurcuk.notification.internal;

/** Gönderilecek e-posta: düz metin ve HTML aynı içerikten üretilir (EmailLayout). */
public record Email(String subject, String text, String html) {
}
