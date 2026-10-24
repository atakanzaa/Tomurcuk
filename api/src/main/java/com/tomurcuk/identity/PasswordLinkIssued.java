package com.tomurcuk.identity;

/**
 * Şifre bağlantısı oluşturuldu; kullanıcıya e-postayla gider. Token yalnızca bu olayda ve
 * e-postada durur, veritabanında özeti saklanır. `purpose`: {@link #SETUP} (destek ekibi, 7 gün)
 * ya da {@link #RESET} (giriş ekranından, 1 saat).
 */
public record PasswordLinkIssued(String linkId, String shopId, String name, String email, String shopName,
		String token, String purpose) {

	public static final String SETUP = "setup";

	public static final String RESET = "reset";
}
