package com.tomurcuk.ordering;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Locale;
import java.util.Optional;

import com.tomurcuk.ordering.internal.OrderStore;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Siparişlerin dükkân sınırı olmadan okunması. Yalnızca destek modülü kullanır; dükkân
 * uçları dükkânla sınırlı sorguları (PanelOrders) kullanır.
 */
@Service
@Transactional(readOnly = true)
public class OrderDirectory {

	private static final Locale TR = Locale.forLanguageTag("tr");

	private final OrderStore orders;

	OrderDirectory(OrderStore orders) {
		this.orders = orders;
	}

	public Optional<Order> find(String orderId) {
		return orders.findById(orderId);
	}

	public Optional<Order> findByNumber(String shopId, String number) {
		return orders.findByNumber(shopId, number);
	}

	public List<Order> recent(String shopId, int limit) {
		return orders.recent(shopId, limit);
	}

	public List<Order> openOrUpcoming(LocalDate since) {
		return orders.openOrUpcoming(since, 200);
	}

	/** Sipariş numarası, alıcı adı ya da telefon (en az 4 hane, baştaki 0 olmadan da). */
	public List<Order> search(String query) {
		String text = query.strip().toLowerCase(TR);
		String digits = text.replaceAll("\\D", "").replaceFirst("^0", "");
		return orders.search(text, digits, 20);
	}

	public int countSince(String shopId, Instant since) {
		return orders.countSince(shopId, since);
	}
}
