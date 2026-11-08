package com.tomurcuk.ordering.web;

import com.tomurcuk.identity.ShopPrincipal;
import com.tomurcuk.ordering.internal.Visits;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** Panelde "Ziyaretçiler": vitrine hangi kanaldan gelindiği ve kaçının sipariş verdiği. */
@RestController
@RequestMapping("/api/panel")
class PanelVisitController {

	private final Visits visits;

	PanelVisitController(Visits visits) {
		this.visits = visits;
	}

	@GetMapping("/visits")
	Visits.Stats stats(@AuthenticationPrincipal ShopPrincipal user, @RequestParam(defaultValue = "7") int days) {
		return visits.stats(user.shopId(), days);
	}
}
