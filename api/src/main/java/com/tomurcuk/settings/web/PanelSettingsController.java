package com.tomurcuk.settings.web;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import com.tomurcuk.catalog.Catalog;
import com.tomurcuk.delivery.DeliverySettings;
import com.tomurcuk.delivery.DeliverySettings.ClosedDay;
import com.tomurcuk.delivery.DeliverySettings.SlotRow;
import com.tomurcuk.delivery.DeliverySettings.ZoneRow;
import com.tomurcuk.identity.Permission;
import com.tomurcuk.identity.ShopPrincipal;
import com.tomurcuk.shared.FieldError;
import com.tomurcuk.shared.ValidationException;
import com.tomurcuk.shop.ShopSettings;
import com.tomurcuk.shop.ShopSettings.Profile;
import com.tomurcuk.shop.ShopSettings.ProfileInput;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
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
 * Panelde dükkân ve teslimat ayarları (web/lib/api/contract.ts). Okumayı dükkânın herkesi yapar;
 * değiştirmek `CATALOG_EDIT` ister (yetki matrisinde "Ürün, fiyat, teslimat ayarı"). Dükkân
 * oturumdan gelir.
 */
@RestController
@RequestMapping("/api/panel/settings")
class PanelSettingsController {

	private final ShopSettings shop;

	private final DeliverySettings delivery;

	private final Catalog catalog;

	PanelSettingsController(ShopSettings shop, DeliverySettings delivery, Catalog catalog) {
		this.shop = shop;
		this.delivery = delivery;
		this.catalog = catalog;
	}

	/** web/lib/api/types.ts `PanelSettings` */
	record SettingsResponse(Profile profile, List<SlotRow> slots, List<ZoneRow> zones, List<ClosedDay> closedDays) {
	}

	@GetMapping
	SettingsResponse settings(@AuthenticationPrincipal ShopPrincipal user) {
		return new SettingsResponse(shop.profile(user.shopId()), delivery.slots(user.shopId()),
				delivery.zones(user.shopId()), delivery.closedDays(user.shopId()));
	}

	@PutMapping("/profile")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	void profile(@AuthenticationPrincipal ShopPrincipal user, @RequestBody ProfileInput body) {
		requireEdit(user);
		String featured = body.featuredProductId();
		if (featured != null && !featured.isBlank() && catalog.findActiveProduct(user.shopId(), featured).isEmpty()) {
			throw ValidationException.of("featuredProductId", FieldError.of("option_invalid"));
		}
		shop.updateProfile(user.shopId(), body);
	}

	@PutMapping("/same-day-cutoff")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	void cutoff(@AuthenticationPrincipal ShopPrincipal user, @RequestBody Map<String, String> body) {
		requireEdit(user);
		shop.updateSameDayCutoff(user.shopId(), body.get("sameDayCutoff"));
	}

	@PutMapping("/slots")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	void slots(@AuthenticationPrincipal ShopPrincipal user, @RequestBody List<SlotRow> body) {
		requireEdit(user);
		delivery.replaceSlots(user.shopId(), body);
	}

	@PutMapping("/zones")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	void zones(@AuthenticationPrincipal ShopPrincipal user, @RequestBody List<ZoneRow> body) {
		requireEdit(user);
		delivery.replaceZones(user.shopId(), body);
	}

	@PostMapping("/closed-days")
	ClosedDay addClosedDay(@AuthenticationPrincipal ShopPrincipal user, @RequestBody Map<String, String> body) {
		requireEdit(user);
		return delivery.addClosedDay(user.shopId(), body.get("date"));
	}

	@DeleteMapping("/closed-days/{date}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	void removeClosedDay(@AuthenticationPrincipal ShopPrincipal user,
			@PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
		requireEdit(user);
		if (!delivery.removeClosedDay(user.shopId(), date)) {
			throw new ResponseStatusException(HttpStatus.NOT_FOUND);
		}
	}

	private static void requireEdit(ShopPrincipal user) {
		if (!user.can(Permission.CATALOG_EDIT)) {
			throw new AccessDeniedException("Ayarları yalnızca dükkân sahibi değiştirir");
		}
	}
}
