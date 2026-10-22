package com.tomurcuk.ordering.web;

import java.util.List;
import java.util.Map;

import com.tomurcuk.ordering.internal.Checkout;
import com.tomurcuk.ordering.internal.Checkout.CardInput;
import com.tomurcuk.ordering.internal.Checkout.DeliveryInput;
import com.tomurcuk.ordering.internal.Checkout.PaymentReturn;
import com.tomurcuk.ordering.internal.Checkout.Placed;
import com.tomurcuk.ordering.internal.Checkout.PlaceOrderInput;
import com.tomurcuk.ordering.internal.Draft;
import com.tomurcuk.ordering.internal.Tracking;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

/**
 * Alıcı sipariş akışı (web/lib/api/contract.ts). Doğrulama hataları 422 ve alan → kod
 * olarak döner; taslak bulunamazsa ya da süresi dolduysa `draft_incomplete`.
 */
@RestController
@RequestMapping("/api/public/shops/{shopId}")
class PublicCheckoutController {

	private final Checkout checkout;

	PublicCheckoutController(Checkout checkout) {
		this.checkout = checkout;
	}

	@PostMapping("/drafts")
	@ResponseStatus(HttpStatus.CREATED)
	Draft createDraft(@PathVariable String shopId, @RequestBody CreateDraft body) {
		return checkout.createDraft(shopId, body.productId(), body.optionIds());
	}

	@GetMapping("/drafts/{draftId}")
	Draft draft(@PathVariable String shopId, @PathVariable String draftId) {
		return checkout.getDraft(shopId, draftId).orElseThrow(PublicCheckoutController::notFound);
	}

	@PutMapping("/drafts/{draftId}/delivery")
	Draft saveDelivery(@PathVariable String shopId, @PathVariable String draftId, @RequestBody DeliveryInput body) {
		return checkout.saveDelivery(shopId, draftId, body);
	}

	@PutMapping("/drafts/{draftId}/card")
	Draft saveCard(@PathVariable String shopId, @PathVariable String draftId, @RequestBody CardInput body) {
		return checkout.saveCard(shopId, draftId, body);
	}

	@PostMapping("/drafts/{draftId}/order")
	Placed placeOrder(@PathVariable String shopId, @PathVariable String draftId, @RequestBody PlaceOrderInput body) {
		return checkout.placeOrder(shopId, draftId, body);
	}

	/** Ödeme sayfasından dönüşte token'la çağrılır; sonuç sağlayıcıdan alınır. */
	@PostMapping("/payments/complete")
	PaymentReturn completePayment(@PathVariable String shopId, @RequestBody Map<String, String> body) {
		return checkout.completePayment(shopId, body.getOrDefault("token", ""))
			.orElseThrow(PublicCheckoutController::notFound);
	}

	@GetMapping("/tracking/{token}")
	Tracking tracking(@PathVariable String shopId, @PathVariable String token) {
		return checkout.tracking(shopId, token).orElseThrow(PublicCheckoutController::notFound);
	}

	/** Sipariş numarası ve gönderen telefonu eşleşmezse 404; hangisinin yanlış olduğu söylenmez. */
	@PostMapping("/tracking-lookup")
	Map<String, String> findTrackingToken(@PathVariable String shopId, @RequestBody Lookup body) {
		return checkout.findTrackingToken(shopId, body.number(), body.phone())
			.map(token -> Map.of("token", token))
			.orElseThrow(PublicCheckoutController::notFound);
	}

	private static ResponseStatusException notFound() {
		return new ResponseStatusException(HttpStatus.NOT_FOUND);
	}

	record CreateDraft(String productId, List<String> optionIds) {
	}

	record Lookup(String number, String phone) {
	}
}
