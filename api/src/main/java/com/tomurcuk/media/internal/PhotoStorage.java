package com.tomurcuk.media.internal;

import java.util.Locale;
import java.util.Optional;

import com.tomurcuk.media.PhotoKind;
import com.tomurcuk.shared.Ids;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/** `media.Photos`'un arkası: görüntüyü hazırlar ve seçili depoya yazar. */
@Component
public class PhotoStorage {

	private static final Logger log = LoggerFactory.getLogger(PhotoStorage.class);

	private final PhotoStore store;

	PhotoStorage(PhotoStore store) {
		this.store = store;
	}

	/** Görüntü uygun değilse boş döner. */
	public Optional<String> store(byte[] content, PhotoKind kind) {
		byte[] jpeg;
		try {
			jpeg = PhotoImages.toJpeg(content, kind);
		}
		catch (PhotoImages.InvalidPhoto ex) {
			log.info("Fotoğraf reddedildi: {}", ex.getMessage());
			return Optional.empty();
		}
		return Optional.of(store.put(Ids.newId().toLowerCase(Locale.ROOT) + ".jpg", jpeg));
	}

	public boolean owns(String url) {
		return store.owns(url);
	}
}
