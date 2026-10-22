package com.tomurcuk.payment;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;

/** Dükkânın ödeme hesabı. Destek yalnızca durumunu görür; değiştiremez. */
@Service
public class PaymentAccounts {

	private final JdbcClient jdbc;

	PaymentAccounts(JdbcClient jdbc) {
		this.jdbc = jdbc;
	}

	/** "iyzico, onaylı" ya da "Tanımlı değil". */
	public String label(String shopId) {
		return jdbc.sql("SELECT iyzico_sub_merchant_key FROM shop_payment_account WHERE shop_id = :shopId")
			.param("shopId", shopId)
			.query(String.class)
			.optional()
			.map(key -> "iyzico, onaylı")
			.orElse("Tanımlı değil");
	}
}
