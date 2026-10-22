package com.tomurcuk.shop.internal;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/** Dükkânın eski adresi; bu slug'la gelen istek güncel adrese kalıcı olarak yönlenir. */
@Entity
@Table(name = "shop_slug_history")
public class ShopSlugHistory {

	@Id
	private String slug;

	@Column(name = "shop_id")
	private String shopId;

	protected ShopSlugHistory() {
	}

	public String getSlug() {
		return slug;
	}

	public String getShopId() {
		return shopId;
	}
}
