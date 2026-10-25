package com.tomurcuk.shop;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;

import com.tomurcuk.shop.internal.ShopRepository;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class ShopDirectory {

	private final ShopRepository shops;

	private final Clock clock;

	ShopDirectory(ShopRepository shops, Clock clock) {
		this.shops = shops;
		this.clock = clock;
	}

	public List<ShopView> all() {
		Instant now = clock.instant();
		return shops.findAll(Sort.by("name")).stream().map(shop -> ShopView.of(shop, now)).toList();
	}

	/** Dükkânın Tomurcuk'a katıldığı gün. */
	public Optional<LocalDate> since(String shopId) {
		return shops.findById(shopId).map(shop -> LocalDate.ofInstant(shop.getCreatedAt(), ZoneId.of(shop.getTimeZone())));
	}

	public Optional<ShopView> view(String shopId) {
		return shops.findById(shopId).map(shop -> ShopView.of(shop, clock.instant()));
	}

	public Optional<ShopInfo> find(String shopId) {
		return shops.findById(shopId)
			.map(shop -> new ShopInfo(shop.getId(), shop.getSlug(), shop.getName(),
					shop.effectiveStatus(clock.instant()), shop.getSameDayCutoff(), ZoneId.of(shop.getTimeZone())));
	}

	/** Durumun ayrıntısı; panel ve destek ekranı içindir, gerekçe vitrine çıkmaz. */
	public Optional<StatusDetail> statusDetail(String shopId) {
		return shops.findById(shopId)
			.map(shop -> {
				ShopStatus status = shop.effectiveStatus(clock.instant());
				return new StatusDetail(status, status == ShopStatus.OPEN ? "" : shop.getStatusReason(),
						status == ShopStatus.PAUSED ? shop.getPausedUntil() : null, shop.getStatusChangedAt(),
						shop.getStatusChangedBy());
			});
	}

	/** web/lib/api/types.ts `ShopStatusDetail`. */
	public record StatusDetail(ShopStatus status, String reason, Instant pausedUntil, Instant changedAt,
			String changedBy) {
	}
}
