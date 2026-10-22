package com.tomurcuk.shop.web;

import java.util.List;

import com.tomurcuk.shared.ClockTimes;
import com.tomurcuk.shop.ShopPlan;
import com.tomurcuk.shop.internal.Shop;
import com.tomurcuk.shop.internal.ShopSlugHistory;

/** web/lib/api/types.ts `Shop` */
record ShopResponse(
		String id,
		String name,
		String shortName,
		String slug,
		List<String> previousSlugs,
		String phone,
		String address,
		String logoUrl,
		boolean active,
		ShopPlan plan,
		String sameDayCutoff,
		String timeZone,
		String description,
		String descriptionShort,
		String openingHours,
		String featuredProductId) {

	static ShopResponse of(Shop shop) {
		return new ShopResponse(
				shop.getId(),
				shop.getName(),
				shop.getShortName(),
				shop.getSlug(),
				shop.getPreviousSlugs().stream().map(ShopSlugHistory::getSlug).sorted().toList(),
				shop.getPhone(),
				shop.getAddress(),
				shop.getLogoUrl(),
				shop.isActive(),
				shop.getPlan(),
				ClockTimes.format(shop.getSameDayCutoff()),
				shop.getTimeZone(),
				shop.getDescription(),
				shop.getDescriptionShort(),
				shop.getOpeningHours(),
				shop.getFeaturedProductId());
	}
}
