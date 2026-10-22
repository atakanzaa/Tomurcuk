package com.tomurcuk.ordering;

/**
 * Sipariş kesinleşti: havalede sipariş anında, kartla ödemede ödeme ilk kez onaylanınca.
 * Gönderene onay SMS'i, dükkân sahibine yeni sipariş e-postası gider.
 */
public record OrderConfirmed(OrderNotice order) {
}
