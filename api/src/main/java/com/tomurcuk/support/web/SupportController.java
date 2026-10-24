package com.tomurcuk.support.web;

import java.util.List;
import java.util.Map;

import com.tomurcuk.audit.AuditLog;
import com.tomurcuk.identity.Impersonation;
import com.tomurcuk.identity.Impersonations;
import com.tomurcuk.identity.PlatformPrincipal;
import com.tomurcuk.marketing.PilotApplications;
import com.tomurcuk.support.internal.Onboarding;
import com.tomurcuk.support.internal.SupportDesk;
import com.tomurcuk.support.internal.Views;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

/** Müşteri hizmetleri paneli (web/lib/api/contract.ts); platform oturumu ister. */
@RestController
@RequestMapping("/api/support")
class SupportController {

	private final SupportDesk desk;

	private final Impersonations impersonations;

	private final Onboarding onboarding;

	private final PilotApplications applications;

	SupportController(SupportDesk desk, Impersonations impersonations, Onboarding onboarding,
			PilotApplications applications) {
		this.desk = desk;
		this.impersonations = impersonations;
		this.onboarding = onboarding;
		this.applications = applications;
	}

	@GetMapping("/pilot-applications")
	List<PilotApplications.View> pilotApplications() {
		return applications.list();
	}

	/** Dükkân, sahibinin hesabı ve şifre bağlantısı; bağlantı yalnızca bu yanıtta döner. */
	@PostMapping("/shops")
	@ResponseStatus(HttpStatus.CREATED)
	Onboarding.PasswordLink openShop(@AuthenticationPrincipal PlatformPrincipal user,
			@RequestBody Onboarding.OpenShopInput body) {
		return onboarding.open(user, body);
	}

	@PostMapping("/shops/{shopId}/password-link")
	Onboarding.PasswordLink passwordLink(@AuthenticationPrincipal PlatformPrincipal user,
			@PathVariable String shopId) {
		return onboarding.newPasswordLink(user, shopId).orElseThrow(SupportController::notFound);
	}

	@GetMapping("/tickets")
	List<Views.TicketSummary> tickets() {
		return desk.tickets();
	}

	@GetMapping("/tickets/{ticketId}")
	Views.TicketDetail ticket(@PathVariable String ticketId) {
		return desk.ticket(ticketId).orElseThrow(SupportController::notFound);
	}

	@PostMapping("/tickets/{ticketId}/replies")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	void reply(@AuthenticationPrincipal PlatformPrincipal user, @PathVariable String ticketId,
			@RequestBody Reply body) {
		desk.reply(user, ticketId, body.text(), body.internal(), body.waitForShop());
	}

	@PostMapping("/tickets/{ticketId}/escalate")
	Map<String, Boolean> escalate(@AuthenticationPrincipal PlatformPrincipal user, @PathVariable String ticketId) {
		return Map.of("escalated", desk.escalate(user, ticketId));
	}

	@PostMapping("/orders/{orderId}/reveal-phone")
	Map<String, String> revealPhone(@AuthenticationPrincipal PlatformPrincipal user, @PathVariable String orderId,
			@RequestBody Reveal body) {
		return desk.revealPhone(user, orderId, body.field(), body.reason())
			.map(phone -> Map.of("phone", phone))
			.orElseThrow(SupportController::notFound);
	}

	@GetMapping("/orders")
	List<Views.ShopOrderView> orders() {
		return desk.orders();
	}

	@GetMapping("/shops")
	List<Views.ShopSummary> shops() {
		return desk.shops();
	}

	@GetMapping("/shops/{shopId}")
	Views.ShopOverview shop(@PathVariable String shopId) {
		return desk.overview(shopId).orElseThrow(SupportController::notFound);
	}

	@PostMapping("/shops/{shopId}/notes")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	void addNote(@AuthenticationPrincipal PlatformPrincipal user, @PathVariable String shopId,
			@RequestBody Map<String, String> body) {
		desk.addNote(user, shopId, body.get("text"));
	}

	@PostMapping("/shops/{shopId}/impersonations")
	@ResponseStatus(HttpStatus.CREATED)
	Impersonation impersonate(@AuthenticationPrincipal PlatformPrincipal user, @PathVariable String shopId,
			@RequestBody Map<String, String> body) {
		return desk.impersonate(user, shopId, body.get("reason")).orElseThrow(SupportController::notFound);
	}

	@DeleteMapping("/impersonations/{impersonationId}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	void endImpersonation(@AuthenticationPrincipal PlatformPrincipal user, @PathVariable String impersonationId) {
		impersonations.end(impersonationId, user);
	}

	@GetMapping("/search")
	Views.SearchResult search(@AuthenticationPrincipal PlatformPrincipal user, @RequestParam("q") String query) {
		return desk.search(user, query);
	}

	@GetMapping("/audit")
	List<AuditLog.View> audit(@AuthenticationPrincipal PlatformPrincipal user) {
		return desk.auditLog(user);
	}

	@GetMapping("/canned-replies")
	List<Views.CannedReply> cannedReplies() {
		return desk.cannedReplies();
	}

	private static ResponseStatusException notFound() {
		return new ResponseStatusException(HttpStatus.NOT_FOUND);
	}

	record Reply(String text, boolean internal, boolean waitForShop) {
	}

	record Reveal(String field, String reason) {
	}
}
