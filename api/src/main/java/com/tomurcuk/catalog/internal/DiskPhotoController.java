package com.tomurcuk.catalog.internal;

import java.time.Duration;

import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

/**
 * Diskteki fotoğraf; frontend `/foto/<ad>` yolunda bunu aktarır. R2'deki fotoğraf doğrudan R2'nin
 * adresinden okunur; R2'ye geçmeden önce diske yüklenenler buradan okunmaya devam eder.
 */
@RestController
class DiskPhotoController {

	private final DiskPhotoStore store;

	DiskPhotoController(DiskPhotoStore store) {
		this.store = store;
	}

	@GetMapping("/api/public/photos/{name}")
	ResponseEntity<byte[]> photo(@PathVariable String name) {
		return store.read(name)
			.map(bytes -> ResponseEntity.ok()
				.contentType(MediaType.IMAGE_JPEG)
				.cacheControl(CacheControl.maxAge(Duration.ofDays(365)).cachePublic().immutable())
				.body(bytes))
			.orElse(ResponseEntity.notFound().build());
	}
}
