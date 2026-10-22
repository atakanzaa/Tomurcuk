package com.tomurcuk.support.web;

import java.util.List;
import java.util.Map;

import com.tomurcuk.identity.ShopPrincipal;
import com.tomurcuk.support.internal.SupportDesk;
import com.tomurcuk.support.internal.Views;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/** Panelden açılan destek talepleri; dahili notlar dükkâna dönmez. */
@RestController
@RequestMapping("/api/panel/tickets")
class PanelTicketController {

	private final SupportDesk desk;

	PanelTicketController(SupportDesk desk) {
		this.desk = desk;
	}

	@GetMapping
	List<Views.TicketSummary> tickets(@AuthenticationPrincipal ShopPrincipal user) {
		return desk.shopTickets(user);
	}

	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	Map<String, String> open(@AuthenticationPrincipal ShopPrincipal user, @RequestBody TicketInput body) {
		return Map.of("ticketId", desk.openTicket(user, body.subject(), body.category(), body.orderNumber(), body.text()));
	}

	record TicketInput(String subject, String category, String orderNumber, String text) {
	}
}
