package com.tomurcuk.delivery.internal;

import java.time.LocalTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/** Haftalık saat aralığı şablonu. */
@Entity
@Table(name = "time_slot")
public class TimeSlot {

	@Id
	private String id;

	private String shopId;

	@Column(name = "start_time")
	private LocalTime start;

	@Column(name = "end_time")
	private LocalTime end;

	private int capacity;

	/** Kaldırılan aralık pasiftir; eski siparişler ve günlük doluluk ona bağlı kalır. */
	private boolean active;

	protected TimeSlot() {
	}

	public TimeSlot(String id, String shopId) {
		this.id = id;
		this.shopId = shopId;
		this.active = true;
	}

	public void update(LocalTime start, LocalTime end, int capacity) {
		this.start = start;
		this.end = end;
		this.capacity = capacity;
		this.active = true;
	}

	public void deactivate() {
		this.active = false;
	}

	public boolean isActive() {
		return active;
	}

	public String getId() {
		return id;
	}

	public String getShopId() {
		return shopId;
	}

	public LocalTime getStart() {
		return start;
	}

	public LocalTime getEnd() {
		return end;
	}

	public int getCapacity() {
		return capacity;
	}
}
