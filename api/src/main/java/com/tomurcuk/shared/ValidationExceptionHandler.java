package com.tomurcuk.shared;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
class ValidationExceptionHandler {

	@ExceptionHandler(ValidationException.class)
	@ResponseStatus(HttpStatus.UNPROCESSABLE_CONTENT)
	Map<String, Object> handle(ValidationException ex) {
		return Map.of("errors", ex.getErrors());
	}
}
