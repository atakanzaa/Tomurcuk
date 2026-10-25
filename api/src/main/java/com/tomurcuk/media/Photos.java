package com.tomurcuk.media;


import com.tomurcuk.media.internal.PhotoStorage;
import com.tomurcuk.shared.FieldError;
import com.tomurcuk.shared.ValidationException;
import org.springframework.stereotype.Service;

/**
 * Yüklenen fotoğraflar: ürün fotoğrafı (4:5 kırpılır) ve teslim fotoğrafı (oranı korunur).
 * Depo yerelde disk, sunucularda Cloudflare R2 (`tomurcuk.photos.store`). Okunamayan ya da
 * uygun olmayan dosya `photo` alanında `photo_invalid` hatası verir.
 */
@Service
public class Photos {

	private final PhotoStorage storage;

	Photos(PhotoStorage storage) {
		this.storage = storage;
	}

	/** Herkese açık adresini döner. */
	public String store(PhotoKind kind, byte[] content) {
		return storage.store(content, kind).orElseThrow(Photos::invalid);
	}

	public String storeProductPhoto(byte[] content) {
		return store(PhotoKind.PRODUCT, content);
	}

	public String storeDeliveryPhoto(byte[] content) {
		return store(PhotoKind.DELIVERY, content);
	}

	/** Panelden gelen bir fotoğraf adresi yalnızca Tomurcuk'un deposundan olabilir. */
	public boolean owns(String url) {
		return url != null && storage.owns(url);
	}


	private static ValidationException invalid() {
		return ValidationException.of("photo", FieldError.of("photo_invalid"));
	}
}
