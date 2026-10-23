package com.tomurcuk.discovery.web;

import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.List;

import com.tomurcuk.discovery.Area;
import com.tomurcuk.discovery.Discovery;
import com.tomurcuk.discovery.Pick;
import com.tomurcuk.discovery.ShopMatch;
import com.tomurcuk.shared.FieldError;
import com.tomurcuk.shared.ValidationException;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** Alıcı ana sayfasının okumaları; oturum gerekmez. */
@RestController
@RequestMapping("/api/public/discover")
class DiscoveryController {

	private static final int PICKS = 4;

	private final Discovery discovery;

	DiscoveryController(Discovery discovery) {
		this.discovery = discovery;
	}

	@GetMapping("/areas")
	List<Area> areas() {
		return discovery.areas();
	}

	@GetMapping("/shops")
	List<ShopMatch> shops(@RequestParam String district, @RequestParam(required = false) String neighborhood,
			@RequestParam String date) {
		LocalDate day;
		try {
			day = LocalDate.parse(date);
		}
		catch (DateTimeParseException ex) {
			throw ValidationException.of("date", FieldError.of("date_out_of_range"));
		}
		return discovery.shops(district, neighborhood == null || neighborhood.isBlank() ? null : neighborhood, day);
	}

	@GetMapping("/picks")
	List<Pick> picks() {
		return discovery.picks(PICKS);
	}
}
