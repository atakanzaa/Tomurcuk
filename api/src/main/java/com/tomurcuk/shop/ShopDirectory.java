package com.tomurcuk.shop;

import java.time.ZoneId;
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

	public Optional<ShopInfo> find(String shopId) {
		return shops.findById(shopId)
			.map(shop -> new ShopInfo(shop.getId(), shop.getSlug(), shop.getName(), shop.isActive(),
					shop.getSameDayCutoff(), ZoneId.of(shop.getTimeZone())));
	}
}
