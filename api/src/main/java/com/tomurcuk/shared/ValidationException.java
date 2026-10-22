package com.tomurcuk.shared;

import java.util.Map;

/** 422 ve `{"errors": {"alan": {"code": ..., "meta": ...}}}` olarak döner. */
public class ValidationException extends RuntimeException {

	private final Map<String, FieldError> errors;

	public ValidationException(Map<String, FieldError> errors) {
		super("Doğrulama hatası: " + errors.keySet());
		this.errors = Map.copyOf(errors);
	}

	public static ValidationException of(String field, FieldError error) {
		return new ValidationException(Map.of(field, error));
	}

	public Map<String, FieldError> getErrors() {
		return errors;
	}
}
