package com.tomurcuk.notification.internal;

import java.util.Collection;
import java.util.Set;
import java.util.stream.Collectors;

import com.tomurcuk.notification.SmsSender;

/**
 * Staging: gerçek sağlayıcı yalnızca ekip numaralarına gönderir (`tomurcuk.sms.allowed-recipients`).
 * Diğer numaralara gönderilmez; bildirim kaydında bu notla görünür, akış kesilmez.
 */
class AllowListSmsSender implements SmsSender {

	private final SmsSender delegate;

	private final Set<String> allowed;

	AllowListSmsSender(SmsSender delegate, Collection<String> numbers) {
		this.delegate = delegate;
		this.allowed = numbers.stream().map(NetgsmSmsSender::digits).collect(Collectors.toUnmodifiableSet());
	}

	@Override
	public Result send(String phone, String text) {
		if (allowed.contains(NetgsmSmsSender.digits(phone))) {
			return delegate.send(phone, text);
		}
		return new Result(true, "Gönderilmedi: ekip numarası değil", false);
	}
}
