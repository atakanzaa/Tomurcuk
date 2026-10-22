package com.tomurcuk.shop;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;

import com.tomurcuk.shop.internal.ShopRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class ShopDirectory {

	private final ShopRepository shops;

	ShopDirectory(ShopRepository shops) {
		this.shops = shops;
	}

	public List<ShopView> all() {
		return shops.findAll(org.springframework.data.domain.Sort.by("name")).stream().map(ShopView::of).toList();
	}

	/** Dükkânın Tomurcuk'a katıldığı gün. */
	public Optional<LocalDate> since(String shopId) {
		return shops.findById(shopId).map(shop -> LocalDate.ofInstant(shop.getCreatedAt(), ZoneId.of(shop.getTimeZone())));
	}

	public Optional<ShopView> view(String shopId) {
		return shops.findById(shopId).map(ShopView::of);
	}

	public Optional<ShopInfo> find(String shopId) {
		return shops.findById(shopId)
			.map(shop -> new ShopInfo(shop.getId(), shop.getSlug(), shop.getName(), shop.isActive(),
					shop.getSameDayCutoff(), ZoneId.of(shop.getTimeZone())));
	}
}
