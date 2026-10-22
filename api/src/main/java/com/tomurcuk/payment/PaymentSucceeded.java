package com.tomurcuk.payment;

/** Bir siparişin kart ödemesi ilk kez onaylandı. Aynı ödeme için ikinci kez yayınlanmaz. */
public record PaymentSucceeded(String orderId, String shopId, String paymentId) {
}
