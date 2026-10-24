package com.tomurcuk.delivery.web;

import java.time.Duration;
import java.util.List;
import java.util.Map;

import com.tomurcuk.delivery.Places;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/** İstanbul'un ilçe ve mahalleleri; panelde teslim bölgesi seçimi için. Liste uygulamayla gelir. */
@RestController
class PublicPlacesController {

	private final Places places;

	PublicPlacesController(Places places) {
		this.places = places;
	}

	@GetMapping("/api/public/places/istanbul")
	ResponseEntity<Map<String, List<String>>> istanbul() {
		return ResponseEntity.ok().cacheControl(CacheControl.maxAge(Duration.ofDays(1))).body(places.istanbul());
	}
}
