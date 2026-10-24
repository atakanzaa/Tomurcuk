package com.tomurcuk.delivery.internal;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/** Bölge silinmez, pasife alınır; ücret kuruş cinsinden. */
@Entity
@Table(name = "delivery_zone")
public class DeliveryZone {

	@Id
	private String id;

	private String shopId;

	private String district;

	private String neighborhood;

	private long fee;

	private boolean active;

	/** Vitrindeki seçim listesinde dükkânın belirlediği sıra. */
	private int position;

	protected DeliveryZone() {
	}

	public DeliveryZone(String id, String shopId) {
		this.id = id;
		this.shopId = shopId;
	}

	public void update(String district, String neighborhood, long fee, int position) {
		this.district = district;
		this.neighborhood = neighborhood;
		this.fee = fee;
		this.position = position;
		this.active = true;
	}

	public void deactivate() {
		this.active = false;
	}

	public String getId() {
		return id;
	}

	public String getShopId() {
		return shopId;
	}

	public String getDistrict() {
		return district;
	}

	public String getNeighborhood() {
		return neighborhood;
	}

	public long getFee() {
		return fee;
	}

	public boolean isActive() {
		return active;
	}
}
