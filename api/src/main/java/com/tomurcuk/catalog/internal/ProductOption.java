package com.tomurcuk.catalog.internal;

import com.tomurcuk.catalog.OptionKind;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

/** Boy, vazo, çikolata gibi ek ücretli seçenekler; ek fiyat kuruş cinsinden. */
@Entity
@Table(name = "product_option")
public class ProductOption {

	@Id
	private String id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "product_id")
	private Product product;

	private String name;

	private String detail;

	private OptionKind kind;

	private long extraPrice;

	private int position;

	protected ProductOption() {
	}

	ProductOption(String id, Product product) {
		this.id = id;
		this.product = product;
	}

	void update(String name, String detail, OptionKind kind, long extraPrice, int position) {
		this.name = name;
		this.detail = detail;
		this.kind = kind;
		this.extraPrice = extraPrice;
		this.position = position;
	}

	public String getId() {
		return id;
	}

	public String getName() {
		return name;
	}

	public String getDetail() {
		return detail;
	}

	public OptionKind getKind() {
		return kind;
	}

	public long getExtraPrice() {
		return extraPrice;
	}

	public int getPosition() {
		return position;
	}
}
