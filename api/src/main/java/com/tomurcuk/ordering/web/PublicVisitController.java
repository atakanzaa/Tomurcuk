package com.tomurcuk.ordering.web;

import com.tomurcuk.ordering.internal.Visits;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/** Vitrin, tarayıcı oturumu başına bir kez ziyaretin kanalını bildirir (web/lib/channel.ts). */
@RestController
@RequestMapping("/api/public/shops/{shopId}")
class PublicVisitController {

	private final Visits visits;

	PublicVisitController(Visits visits) {
		this.visits = visits;
	}

	@PostMapping("/visits")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	void record(@PathVariable String shopId, @RequestBody Visit body) {
		visits.record(shopId, body.channel());
	}

	record Visit(String channel) {
	}
}
