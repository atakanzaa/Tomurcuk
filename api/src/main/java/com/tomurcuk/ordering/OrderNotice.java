package com.tomurcuk.ordering;

import java.time.LocalDate;

/**
 * Bildirimlerin ihtiyaç duyduğu sipariş bilgisi, olay anındaki haliyle. Olaylar kalıcı
 * kaydedildiği için sipariş sonradan değişse de bildirim o anki bilgiyle gider.
 * İsimsiz gönderimde gönderen adı hiç taşınmaz. `cardNote` ve `paymentMethod` sonradan eklendi;
 * önceden kaydedilmiş olaylarda boştur.
 */
public record OrderNotice(String orderId, String shopId, String number, LocalDate deliveryDate, String slotStart,
		String slotEnd, String deliveryTime, String recipientName, String recipientPhone, String senderPhone,
		String senderName, boolean anonymous, String trackingToken, String zoneName, String itemsSummary, long total,
		String cardNote, PaymentMethod paymentMethod) {
}
