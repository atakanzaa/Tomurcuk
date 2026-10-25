package com.tomurcuk.support.internal;

import java.util.Map;
import java.util.Optional;

import com.tomurcuk.audit.AuditLog;
import com.tomurcuk.identity.Permission;
import com.tomurcuk.identity.PlatformPrincipal;
import com.tomurcuk.ordering.OrderDirectory;
import com.tomurcuk.shared.FieldError;
import com.tomurcuk.shared.ValidationException;
import com.tomurcuk.shop.ShopDirectory;
import com.tomurcuk.shop.ShopDirectory.StatusDetail;
import com.tomurcuk.shop.ShopStatus;
import com.tomurcuk.shop.ShopStatuses;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Destek panelinden dükkânın durumu. Siparişleri geçici kapatmak ve geçici kapatmayı kaldırmak
 * bütün destek rollerinin işi (`SHOP_PAUSE`); askıya alma, kalıcı kapatma ve bunlardan geri
 * açma lider ve platform sahibinin (`SHOP_SUSPEND`). Her değişiklik gerekçesiyle denetim kaydına
 * yazılır. Teslim edilmeyi bekleyen siparişi olan dükkân onaysız kalıcı kapatılmaz (`open_orders`).
 */
@Service
public class ShopControl {

	private final ShopStatuses statuses;

	private final ShopDirectory shops;

	private final OrderDirectory orders;

	private final AuditLog audit;

	ShopControl(ShopStatuses statuses, ShopDirectory shops, OrderDirectory orders, AuditLog audit) {
		this.statuses = statuses;
		this.shops = shops;
		this.orders = orders;
		this.audit = audit;
	}

	/** web/lib/api/types.ts `ShopStatusInput`. `confirmOpenOrders`: kalıcı kapatmada açık siparişler görüldü. */
	public record StatusInput(String status, String reason, String pausedUntil, Boolean confirmOpenOrders) {
	}

	@Transactional
	public Optional<StatusDetail> change(PlatformPrincipal user, String shopId, StatusInput input) {
		Optional<StatusDetail> current = shops.statusDetail(shopId);
		if (current.isEmpty()) {
			return Optional.empty();
		}
		ShopStatus target;
		try {
			target = ShopStatus.fromCode(input.status() == null ? "" : input.status());
		}
		catch (IllegalArgumentException ex) {
			throw ValidationException.of("status", FieldError.of("option_invalid"));
		}
		require(user, current.get().status(), target);
		if (target == ShopStatus.CLOSED && !Boolean.TRUE.equals(input.confirmOpenOrders())) {
			int open = orders.countOpen(shopId);
			if (open > 0) {
				throw ValidationException.of("form", FieldError.of("open_orders", Map.of("count", open)));
			}
		}
		Optional<StatusDetail> changed = statuses.change(shopId, input.status(), input.reason(), input.pausedUntil(),
				user.name());
		changed.ifPresent(detail -> audit.record(new AuditLog.Entry("platform", user.userId(), user.name(), shopId,
				ACTIONS.get(target), detail.reason(), null, null)));
		return changed;
	}

	private static final Map<ShopStatus, String> ACTIONS = Map.of(ShopStatus.OPEN, "Dükkân yeniden açıldı",
			ShopStatus.PAUSED, "Siparişler geçici kapatıldı", ShopStatus.SUSPENDED, "Dükkân askıya alındı",
			ShopStatus.CLOSED, "Dükkân kalıcı kapatıldı");

	/** Askıdaki ya da kapalı dükkânı yalnızca `SHOP_SUSPEND` açar; temsilci geçici kapatmayla onu açamaz. */
	private static void require(PlatformPrincipal user, ShopStatus from, ShopStatus to) {
		boolean light = (to == ShopStatus.PAUSED || to == ShopStatus.OPEN)
				&& (from == ShopStatus.OPEN || from == ShopStatus.PAUSED);
		Permission needed = light ? Permission.SHOP_PAUSE : Permission.SHOP_SUSPEND;
		if (!user.can(needed)) {
			throw new AccessDeniedException("Bu durum değişikliği için yetki yok");
		}
	}
}
