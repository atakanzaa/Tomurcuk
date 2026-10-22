package com.tomurcuk.catalog.internal;

import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;

/** Fiyatlar kuruş cinsinden. */
@Entity
@Table(name = "product")
public class Product {

	@Id
	private String id;

	private String shopId;

	private String categoryId;

	private String name;

	private String description;

	private String summary;

	private long price;

	private String photoUrl;

	private boolean active;

	private int position;

	@OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true)
	@OrderBy("position")
	private List<ProductOption> options = new ArrayList<>();

	protected Product() {
	}

	public String getId() {
		return id;
	}

	public String getShopId() {
		return shopId;
	}

	public String getCategoryId() {
		return categoryId;
	}

	public String getName() {
		return name;
	}

	public String getDescription() {
		return description;
	}

	public String getSummary() {
		return summary;
	}

	public long getPrice() {
		return price;
	}

	public String getPhotoUrl() {
		return photoUrl;
	}

	public boolean isActive() {
		return active;
	}

	public int getPosition() {
		return position;
	}

	public List<ProductOption> getOptions() {
		return options;
	}
}
