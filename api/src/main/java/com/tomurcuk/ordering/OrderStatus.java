package com.tomurcuk.ordering;

import com.fasterxml.jackson.annotation.JsonValue;
import com.tomurcuk.shared.CodedEnum;

/** Durum akışı: Yeni → Hazırlanıyor → Yolda → Teslim edildi; ayrıca Teslim edilemedi ve İptal. */
public enum OrderStatus implements CodedEnum {

	NEW("new"), PREPARING("preparing"), ON_WAY("onway"), DELIVERED("delivered"), FAILED("failed"), CANCELLED("cancelled");

	private final String code;

	OrderStatus(String code) {
		this.code = code;
	}

	@Override
	@JsonValue
	public String code() {
		return code;
	}

	/**
	 * İzin verilen geçişler (web/lib/order-flow.ts ile aynı). Teslim edilemeyen sipariş yeniden
	 * yola çıkabilir; teslim edilmiş ve iptal edilmiş sipariş değişmez.
	 */
	public boolean canBecome(OrderStatus next) {
		return switch (this) {
			case NEW -> next == PREPARING || next == CANCELLED;
			case PREPARING -> next == ON_WAY || next == CANCELLED;
			case ON_WAY -> next == DELIVERED || next == FAILED;
			case FAILED -> next == ON_WAY || next == CANCELLED;
			case DELIVERED, CANCELLED -> false;
		};
	}

	public static OrderStatus fromCode(String code) {
		return CodedEnum.fromCode(OrderStatus.class, code);
	}
}
