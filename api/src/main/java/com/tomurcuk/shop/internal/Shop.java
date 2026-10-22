package com.tomurcuk.shop.internal;

import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

import com.tomurcuk.shop.ShopPlan;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Table;

@Entity
@Table(name = "shop")
public class Shop {

	@Id
	private String id;

	private String slug;

	private String name;

	private String shortName;

	private String phone;

	private String address;

	private String logoUrl;

	private boolean active;

	private ShopPlan plan;

	private LocalTime sameDayCutoff;

	private String timeZone;

	private String description;

	private String descriptionShort;

	private String openingHours;

	private String featuredProductId;

	private java.time.Instant createdAt;

	@OneToMany
	@JoinColumn(name = "shop_id")
	private List<ShopSlugHistory> previousSlugs = new ArrayList<>();

	protected Shop() {
	}

	public String getId() {
		return id;
	}

	public String getSlug() {
		return slug;
	}

	public String getName() {
		return name;
	}

	public String getShortName() {
		return shortName;
	}

	public String getPhone() {
		return phone;
	}

	public String getAddress() {
		return address;
	}

	public String getLogoUrl() {
		return logoUrl;
	}

	public boolean isActive() {
		return active;
	}

	public ShopPlan getPlan() {
		return plan;
	}

	public LocalTime getSameDayCutoff() {
		return sameDayCutoff;
	}

	public String getTimeZone() {
		return timeZone;
	}

	public String getDescription() {
		return description;
	}

	public String getDescriptionShort() {
		return descriptionShort;
	}

	public String getOpeningHours() {
		return openingHours;
	}

	public String getFeaturedProductId() {
		return featuredProductId;
	}

	public java.time.Instant getCreatedAt() {
		return createdAt;
	}

	public List<ShopSlugHistory> getPreviousSlugs() {
		return previousSlugs;
	}
}
