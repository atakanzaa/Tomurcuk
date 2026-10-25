package com.tomurcuk.support.internal;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonUnwrapped;
import com.tomurcuk.identity.ShopUsers;
import com.tomurcuk.shop.ShopDirectory;
import com.tomurcuk.ordering.OrderStatus;
import com.tomurcuk.ordering.PaymentMethod;
import com.tomurcuk.ordering.PaymentStatus;
import com.tomurcuk.shop.ShopView;

/** Destek panelinin JSON görünümleri; web/lib/api/types.ts ile aynı alanlar. */
public final class Views {

	private Views() {
	}

	public record Slot(String start, String end) {
	}

	public record TicketSummary(String id, String subject, String shopId, String shopName, String shopDistrict,
			String orderId, String orderNumber, LocalDate orderDate, Slot orderSlot, String category, String priority,
			String status, String assigneeId, String assigneeName, Instant createdAt, Instant waitingSince,
			Instant firstResponseAt) {
	}

	public record TicketMessage(String id, String authorName, String authorOrg, boolean internal, String text,
			Instant at) {
	}

	public record TicketDetail(@JsonUnwrapped TicketSummary summary, List<TicketMessage> messages,
			SupportOrderView order) {
	}

	public record TimelineEvent(Instant at, String text, String actor, boolean failed) {
	}

	/** Kişisel veri maskeli: ad kısaltılmış, telefon yıldızlı. */
	public record SupportOrderView(String id, String number, OrderStatus status, PaymentStatus paymentStatus,
			PaymentMethod paymentMethod, LocalDate deliveryDate, String slotStart, String slotEnd, String recipientName,
			String recipientPhone, String address, String senderName, String senderPhone, long total,
			List<TimelineEvent> timeline) {
	}

	public record ShopOrderView(@JsonUnwrapped SupportOrderView order, String shopName) {
	}

	public record ShopSummary(ShopView shop, String district, LocalDate since, int monthlyOrders, int openTickets,
			Instant lastActivityAt) {
	}

	public record LastLogin(Instant at, String userName) {
	}

	public record NotificationView(String id, String shopId, String orderNumber, String channel, String text,
			String recipient, boolean delivered, String providerResponse, Instant at) {
	}

	public record Note(String id, String shopId, String authorName, String text, Instant at) {
	}

	/** `status`: durumun gerekçesi ve kim, ne zaman değiştirdi; `openOrders`: teslim edilmeyi bekleyenler. */
	public record ShopOverview(@JsonUnwrapped ShopSummary summary, String paymentAccount, LastLogin lastLogin,
			List<SupportOrderView> recentOrders, List<NotificationView> notifications, int smsUsed, int smsLimit,
			List<Note> notes, List<ShopUsers.View> users, List<TicketSummary> tickets,
			ShopDirectory.StatusDetail status, int openOrders) {
	}

	public record SearchResult(List<ShopOrderView> orders, List<ShopSummary> shops, List<TicketSummary> tickets) {
	}

	public record CannedReply(String id, String title, String text, String category) {
	}
}
