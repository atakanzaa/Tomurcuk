package com.tomurcuk.shop.internal;

import com.tomurcuk.shared.CodedEnumConverter;
import com.tomurcuk.shop.ShopStatus;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
class ShopStatusConverter extends CodedEnumConverter<ShopStatus> {

	ShopStatusConverter() {
		super(ShopStatus.class);
	}
}
