package com.tomurcuk.catalog.internal;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

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

	/** Kapak fotoğrafı; `photos`'un ilki. Vitrin, kartlar ve alıcı sayfası bunu okur. */
	private String photoUrl;

	/** Sırayla en fazla dört fotoğraf. */
	@JdbcTypeCode(SqlTypes.ARRAY)
	private List<String> photos = new ArrayList<>();

	private boolean active;

	private int position;

	private Instant updatedAt;

	/** Son değiştirenin adı ("Son değişiklik: bugün 09:12, Ayla Er"). */
	private String updatedBy;

	private Instant deletedAt;

	@OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true)
	@OrderBy("position")
	private List<ProductOption> options = new ArrayList<>();

	protected Product() {
	}

	Product(String id, String shopId, int position) {
		this.id = id;
		this.shopId = shopId;
		this.position = position;
	}

	/** Seçenekler `options` üzerinden ayrıca güncellenir. */
	void update(String categoryId, String name, String summary, String description, long price, List<String> photos,
			boolean active, Instant at, String by) {
		this.categoryId = categoryId;
		this.name = name;
		this.summary = summary;
		this.description = description;
		this.price = price;
		this.photos = new ArrayList<>(photos);
		this.photoUrl = photos.isEmpty() ? null : photos.getFirst();
		this.active = active;
		this.updatedAt = at;
		this.updatedBy = by;
	}

	/** Satıştan kalkar ve panelden de silinir; siparişlerdeki kopyası durur. */
	void delete(Instant at, String by) {
		this.active = false;
		this.deletedAt = at;
		this.updatedAt = at;
		this.updatedBy = by;
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

	/** Eski kayıtlarda liste boşsa kapak tek fotoğraftır. */
	public List<String> getPhotos() {
		if (photos.isEmpty() && photoUrl != null) {
			return List.of(photoUrl);
		}
		return photos;
	}

	public Instant getUpdatedAt() {
		return updatedAt;
	}

	public String getUpdatedBy() {
		return updatedBy;
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
