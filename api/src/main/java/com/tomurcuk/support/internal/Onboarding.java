package com.tomurcuk.support.internal;

import java.util.List;
import java.util.Optional;

import com.tomurcuk.audit.AuditLog;
import com.tomurcuk.catalog.Catalog;
import com.tomurcuk.delivery.DeliverySettings;
import com.tomurcuk.delivery.DeliverySettings.SlotRow;
import com.tomurcuk.identity.PasswordLinks;
import com.tomurcuk.identity.Permission;
import com.tomurcuk.identity.PlatformPrincipal;
import com.tomurcuk.identity.ShopUsers;
import com.tomurcuk.marketing.PilotApplications;
import com.tomurcuk.shop.ShopDirectory;
import com.tomurcuk.shop.ShopRegistry;
import com.tomurcuk.shop.ShopRegistry.NewShop;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.util.UriComponentsBuilder;

/**
 * Destek panelinden dükkân açma: dükkân, ilk kategori, varsayılan saat aralıkları, sahibin hesabı
 * ve şifre bağlantısı tek işlemde. Ürünleri, bölgeleri ve sözleşme bilgilerini sahibi panelden
 * girer. Yalnızca `SHOP_ONBOARD` (platform sahibi ve lider); işlem denetim kaydına yazılır.
 */
@Service
public class Onboarding {

	/** Yeni dükkânın saat aralıkları; sahibi teslimat ayarlarından değiştirir. */
	private static final List<SlotRow> DEFAULT_SLOTS = List.of(new SlotRow(null, "10:00", "13:00", 4),
			new SlotRow(null, "13:00", "16:00", 4), new SlotRow(null, "16:00", "19:00", 4));

	private final ShopRegistry registry;

	private final ShopDirectory shops;

	private final ShopUsers users;

	private final PasswordLinks links;

	private final Catalog catalog;

	private final DeliverySettings delivery;

	private final PilotApplications applications;

	private final AuditLog audit;

	private final String webUrl;

	Onboarding(ShopRegistry registry, ShopDirectory shops, ShopUsers users, PasswordLinks links, Catalog catalog,
			DeliverySettings delivery, PilotApplications applications, AuditLog audit,
			@Value("${tomurcuk.web-url}") String webUrl) {
		this.registry = registry;
		this.shops = shops;
		this.users = users;
		this.links = links;
		this.catalog = catalog;
		this.delivery = delivery;
		this.applications = applications;
		this.audit = audit;
		this.webUrl = webUrl;
	}

	/** `applicationId` başvurudan açılıyorsa; başvuru sonuçlanmış sayılır. */
	public record OpenShopInput(String applicationId, String name, String shortName, String slug, String phone,
			String address, String ownerName, String ownerEmail) {
	}

	/** web/lib/api/types.ts `PasswordLink`: bağlantı yalnızca bu yanıtta görünür. */
	public record PasswordLink(String shopId, String slug, String ownerName, String ownerEmail, String url) {
	}

	@Transactional
	public PasswordLink open(PlatformPrincipal user, OpenShopInput in) {
		require(user);
		String shopId = registry.create(new NewShop(in.name(), in.shortName(), in.slug(), in.phone(), in.address()));
		String ownerId = users.createOwner(shopId, in.ownerName(), in.ownerEmail());
		catalog.createDefaultCategory(shopId);
		delivery.replaceSlots(shopId, DEFAULT_SLOTS);
		if (in.applicationId() != null && !in.applicationId().isBlank()) {
			applications.markOpened(in.applicationId(), shopId);
		}
		audit.record(new AuditLog.Entry("platform", user.userId(), user.name(), shopId, "Dükkân açıldı",
				in.name().strip() + ", sahibi " + in.ownerEmail().strip(), null, null));
		return link(shopId, ownerId);
	}

	/** Şifresini unutan ya da bağlantısı geçen sahip için yenisi; eskisi geçersiz olur. */
	@Transactional
	public Optional<PasswordLink> newPasswordLink(PlatformPrincipal user, String shopId) {
		require(user);
		return users.owner(shopId).map(owner -> {
			audit.record(new AuditLog.Entry("platform", user.userId(), user.name(), shopId,
					"Şifre bağlantısı oluşturuldu", owner.email(), null, null));
			return link(shopId, owner.id());
		});
	}

	private PasswordLink link(String shopId, String ownerId) {
		String token = links.issue(ownerId);
		var shop = shops.view(shopId).orElseThrow();
		var owner = users.owner(shopId).orElseThrow();
		String url = UriComponentsBuilder.fromUriString(webUrl).pathSegment("sifre", token).build().toUriString();
		return new PasswordLink(shopId, shop.slug(), owner.name(), owner.email(), url);
	}

	private static void require(PlatformPrincipal user) {
		if (!user.can(Permission.SHOP_ONBOARD)) {
			throw new AccessDeniedException("Dükkânı platform sahibi ya da destek lideri açar");
		}
	}
}
