package com.tomurcuk.shop;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.format.DateTimeParseException;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;

import com.tomurcuk.shared.FieldError;
import com.tomurcuk.shared.Ids;
import com.tomurcuk.shared.Texts;
import com.tomurcuk.shared.ValidationException;
import com.tomurcuk.shop.internal.Shop;
import com.tomurcuk.shop.internal.ShopRepository;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Dükkânın durumunu değiştirir. Yetki denetimini çağıran yapar (support modülü). Gerekçe
 * zorunludur; geçici kapatmanın bitişi isteğe bağlıdır, verilirse gelecekte ve en çok 30 gün
 * sonra olmalı. Hatalar: `status` (`option_invalid`), `reason` (`required`, `too_long`),
 * `pausedUntil` (`date_out_of_range`).
 */
@Service
public class ShopStatuses {

	static final Duration MAX_PAUSE = Duration.ofDays(30);

	private final ShopRepository shops;

	private final ShopDirectory directory;

	private final ApplicationEventPublisher events;

	private final Clock clock;

	ShopStatuses(ShopRepository shops, ShopDirectory directory, ApplicationEventPublisher events, Clock clock) {
		this.shops = shops;
		this.directory = directory;
		this.events = events;
		this.clock = clock;
	}

	@Transactional
	public Optional<ShopDirectory.StatusDetail> change(String shopId, String statusCode, String reason,
			String pausedUntilText, String changedBy) {
		Optional<Shop> found = shops.findById(shopId);
		if (found.isEmpty()) {
			return Optional.empty();
		}
		Map<String, FieldError> errors = new LinkedHashMap<>();
		ShopStatus status = null;
		try {
			status = ShopStatus.fromCode(statusCode == null ? "" : statusCode);
		}
		catch (IllegalArgumentException ex) {
			errors.put("status", FieldError.of("option_invalid"));
		}
		Instant now = clock.instant();
		// Yeniden açmanın gerekçesi isteğe bağlı; kapatmanınki zorunlu.
		String cleanReason = Texts.check(errors, "reason", reason, 500, status != ShopStatus.OPEN);
		Instant pausedUntil = null;
		if (status == ShopStatus.PAUSED && pausedUntilText != null && !pausedUntilText.isBlank()) {
			try {
				pausedUntil = OffsetDateTime.parse(pausedUntilText).toInstant();
			}
			catch (DateTimeParseException ex) {
				errors.put("pausedUntil", FieldError.of("date_out_of_range"));
			}
			if (pausedUntil != null && (!pausedUntil.isAfter(now) || pausedUntil.isAfter(now.plus(MAX_PAUSE)))) {
				errors.put("pausedUntil", FieldError.of("date_out_of_range"));
			}
		}
		if (!errors.isEmpty()) {
			throw new ValidationException(errors);
		}
		Shop shop = found.get();
		ShopStatus from = shop.effectiveStatus(now);
		shop.changeStatus(status, cleanReason, pausedUntil, now, changedBy);
		shops.save(shop);
		events.publishEvent(new ShopStatusChanged(Ids.newId(), shopId, shop.getName(), from, status, cleanReason,
				pausedUntil));
		return directory.statusDetail(shopId);
	}
}
