package com.tomurcuk.payment.internal;

import java.util.Optional;

/** Dükkânın iyzico alt üye işyeri anahtarı; pazaryeri modelinde zorunludur. */
interface SubMerchants {

	Optional<String> keyOf(String shopId);
}
