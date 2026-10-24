package com.tomurcuk.catalog.internal;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "category")
public class Category {

	@Id
	private String id;

	private String shopId;

	private String slug;

	private String name;

	private int position;

	protected Category() {
	}

	public Category(String id, String shopId, String slug, String name, int position) {
		this.id = id;
		this.shopId = shopId;
		this.slug = slug;
		this.name = name;
		this.position = position;
	}

	public String getId() {
		return id;
	}

	public String getShopId() {
		return shopId;
	}

	public String getSlug() {
		return slug;
	}

	public String getName() {
		return name;
	}

	public int getPosition() {
		return position;
	}
}
