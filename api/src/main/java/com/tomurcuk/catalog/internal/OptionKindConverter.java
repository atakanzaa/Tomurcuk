package com.tomurcuk.catalog.internal;

import com.tomurcuk.catalog.OptionKind;
import com.tomurcuk.shared.CodedEnumConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
class OptionKindConverter extends CodedEnumConverter<OptionKind> {

	OptionKindConverter() {
		super(OptionKind.class);
	}
}
