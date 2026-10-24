package com.tomurcuk.identity;

/**
 * Şifre bağlantısı oluşturuldu; sahibine e-postayla gider. Token yalnızca bu olayda ve
 * e-postada durur, veritabanında özeti saklanır.
 */
public record PasswordLinkIssued(String linkId, String shopId, String name, String email, String shopName,
		String token) {
}
