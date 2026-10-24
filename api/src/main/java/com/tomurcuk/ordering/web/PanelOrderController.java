package com.tomurcuk.ordering.web;

import java.io.IOException;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import com.tomurcuk.identity.ShopPrincipal;
import com.tomurcuk.ordering.OrderStatus;
import com.tomurcuk.ordering.internal.CustomerDetail;
import com.tomurcuk.ordering.internal.CustomerSummary;
import com.tomurcuk.ordering.internal.CustomerWithLastOrder;
import com.tomurcuk.ordering.internal.NewOrders;
import com.tomurcuk.ordering.Order;
import com.tomurcuk.ordering.internal.PanelOrders;
import com.tomurcuk.ordering.internal.PanelOrders.ManualOrderInput;
import com.tomurcuk.ordering.internal.Reminder;
import com.tomurcuk.shared.FieldError;
import com.tomurcuk.shared.ValidationException;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

/**
 * Satıcı paneli (web/lib/api/contract.ts). Dükkân kimliği adresten değil oturumdan gelir;
 * başka dükkânın kaydı 404 döner.
 */
@RestController
@RequestMapping("/api/panel")
class PanelOrderController {

	private final PanelOrders panel;

	PanelOrderController(PanelOrders panel) {
		this.panel = panel;
	}

	@GetMapping("/orders")
	List<Order> orders(@AuthenticationPrincipal ShopPrincipal user,
			@RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
			@RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
		return panel.list(user, from, to);
	}

	/** Panel 30 saniyede bir sorar; en son gelen değişince sesli uyarı verir. */
	@GetMapping("/orders/new")
	NewOrders newOrders(@AuthenticationPrincipal ShopPrincipal user) {
		return panel.newOrders(user);
	}

	@GetMapping("/orders/{orderId}")
	Order order(@AuthenticationPrincipal ShopPrincipal user, @PathVariable String orderId) {
		return panel.get(user, orderId).orElseThrow(PanelOrderController::notFound);
	}

	@PostMapping("/orders/{orderId}/status")
	Order changeStatus(@AuthenticationPrincipal ShopPrincipal user, @PathVariable String orderId,
			@RequestBody Map<String, String> body) {
		OrderStatus next;
		try {
			next = OrderStatus.fromCode(body.getOrDefault("status", ""));
		}
		catch (IllegalArgumentException ex) {
			throw ValidationException.of("status", FieldError.of("draft_incomplete"));
		}
		return panel.changeStatus(user, orderId, next);
	}

	@PostMapping("/orders/{orderId}/paid")
	Order markPaid(@AuthenticationPrincipal ShopPrincipal user, @PathVariable String orderId) {
		return panel.markPaid(user, orderId);
	}

	/** Çok parçalı form, alan adı `file`. */
	@PostMapping("/orders/{orderId}/delivery-photo")
	Order addDeliveryPhoto(@AuthenticationPrincipal ShopPrincipal user, @PathVariable String orderId,
			@RequestParam("file") MultipartFile file) throws IOException {
		if (file.isEmpty()) {
			throw ValidationException.of("photo", FieldError.of("photo_invalid"));
		}
		return panel.addDeliveryPhoto(user, orderId, file.getBytes()).orElseThrow(PanelOrderController::notFound);
	}

	@PostMapping("/orders")
	@ResponseStatus(HttpStatus.CREATED)
	Map<String, String> createManualOrder(@AuthenticationPrincipal ShopPrincipal user,
			@RequestBody ManualOrderInput body) {
		return Map.of("orderId", panel.createManualOrder(user, body));
	}

	@GetMapping("/customers")
	List<CustomerSummary> customers(@AuthenticationPrincipal ShopPrincipal user,
			@RequestParam(required = false) String query) {
		return panel.customers(user, query);
	}

	@GetMapping("/customers/{customerId}")
	CustomerDetail customer(@AuthenticationPrincipal ShopPrincipal user, @PathVariable String customerId) {
		return panel.customer(user, customerId).orElseThrow(PanelOrderController::notFound);
	}

	@GetMapping("/customers/by-phone")
	CustomerWithLastOrder customerByPhone(@AuthenticationPrincipal ShopPrincipal user, @RequestParam String phone) {
		return panel.customerByPhone(user, phone).orElseThrow(PanelOrderController::notFound);
	}

	@GetMapping("/reminders")
	List<Reminder> reminders(@AuthenticationPrincipal ShopPrincipal user,
			@RequestParam(defaultValue = "7") int days) {
		return panel.reminders(user, days);
	}

	private static ResponseStatusException notFound() {
		return new ResponseStatusException(HttpStatus.NOT_FOUND);
	}
}
