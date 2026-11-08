package com.tomurcuk.ordering;

import java.util.Arrays;
import java.util.Optional;

import com.fasterxml.jackson.annotation.JsonValue;
import com.tomurcuk.shared.CodedEnum;

/**
 * Alıcının vitrine hangi kanaldan geldiği: paylaşım bağlantısındaki `?k=`, yoksa yönlendiren
 * site ya da uygulama (web/lib/channel.ts). Kişi bilgisi değildir; panelde yalnızca sayılar görünür.
 */
public enum Channel implements CodedEnum {

	INSTAGRAM("instagram"), WHATSAPP("whatsapp"), GOOGLE("google"), FACEBOOK("facebook"), QR("qr"),
	TOMURCUK("tomurcuk"), OTHER("other"), DIRECT("direct");

	private final String code;

	Channel(String code) {
		this.code = code;
	}

	@Override
	@JsonValue
	public String code() {
		return code;
	}

	public static Channel fromCode(String code) {
		return CodedEnum.fromCode(Channel.class, code);
	}

	/** Bilinmeyen ya da boş kod kanal değildir; tarayıcıdan gelen değere güvenilmez. */
	public static Optional<Channel> parse(String code) {
		return Arrays.stream(values()).filter(c -> c.code.equals(code)).findFirst();
	}
}
