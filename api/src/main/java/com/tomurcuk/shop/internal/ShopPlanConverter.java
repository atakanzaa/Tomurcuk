package com.tomurcuk.shop.internal;

import com.tomurcuk.shared.CodedEnumConverter;
import com.tomurcuk.shop.ShopPlan;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
class ShopPlanConverter extends CodedEnumConverter<ShopPlan> {

	ShopPlanConverter() {
		super(ShopPlan.class);
	}
}
