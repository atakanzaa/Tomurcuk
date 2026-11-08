package com.tomurcuk.shop;

import java.time.Instant;
import java.util.List;

import com.tomurcuk.shared.ClockTimes;
import com.tomurcuk.shop.internal.Shop;
import com.tomurcuk.shop.internal.ShopSlugHistory;

/** Dükkânın vitrin ve panelde gösterilen hali; JSON'u web/lib/api/types.ts `Shop`. */
public record ShopView(
		String id,
		String name,
		String shortName,
		String slug,
		List<String> previousSlugs,
		String phone,
		String address,
		String logoUrl,
		/** Sipariş alıyor mu; `status` açıksa. */
		boolean active,
		ShopStatus status,
		/** Geçici kapatmanın bitişi; vitrin "… itibarıyla yeniden sipariş alıyoruz" der. */
		Instant pausedUntil,
		ShopPlan plan,
		String sameDayCutoff,
		String timeZone,
		String description,
		String descriptionShort,
		String openingHours,
		String featuredProductId,
		/** Favori ürünün yanındaki çiçekçi notu; kart notu etiketinde görünür. */
		String favoriteNote,
		String coverPhotoUrl,
		String story,
		Integer foundedYear,
		List<String> storyPhotos,
		/** `cover` (kapaktan) ya da `tomurcuk` (varsayılan renkler). */
		String themeMode,
		/** Vitrinin rengi; kapaktan renk yoksa ya da `tomurcuk` seçildiyse null. */
		ShopTheme theme,
		/** `cover`, `story` ya da `products`. */
		String layout,
		String instagram,
		/** Boşsa vitrin dükkân telefonunu kullanır. */
		String whatsapp,
		String shareDescription,
		String legalName,
		String taxOffice,
		String taxNumber,
		String email) {

	/** `now`: geçici kapatmanın süresi bu ana göre değerlendirilir. */
	public static ShopView of(Shop shop, Instant now) {
		ShopStatus status = shop.effectiveStatus(now);
		return new ShopView(
				shop.getId(),
				shop.getName(),
				shop.getShortName(),
				shop.getSlug(),
				shop.getPreviousSlugs().stream().map(ShopSlugHistory::getSlug).sorted().toList(),
				shop.getPhone(),
				shop.getAddress(),
				shop.getLogoUrl(),
				status == ShopStatus.OPEN,
				status,
				status == ShopStatus.PAUSED ? shop.getPausedUntil() : null,
				shop.getPlan(),
				ClockTimes.format(shop.getSameDayCutoff()),
				shop.getTimeZone(),
				shop.getDescription(),
				shop.getDescriptionShort(),
				shop.getOpeningHours(),
				shop.getFeaturedProductId(),
				shop.getFavoriteNote(),
				shop.getCoverPhotoUrl(),
				shop.getStory(),
				shop.getFoundedYear(),
				shop.getStoryPhotos(),
				shop.getThemeMode(),
				"cover".equals(shop.getThemeMode()) ? ShopTheme.from(shop.getCoverColor()) : null,
				shop.getLayout(),
				shop.getInstagram(),
				shop.getWhatsapp(),
				shop.getShareDescription(),
				shop.getLegalName(),
				shop.getTaxOffice(),
				shop.getTaxNumber(),
				shop.getEmail());
	}
}
