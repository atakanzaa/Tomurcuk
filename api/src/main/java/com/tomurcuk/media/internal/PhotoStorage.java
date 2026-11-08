package com.tomurcuk.media.internal;

import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.util.Locale;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import javax.imageio.ImageIO;

import com.tomurcuk.media.PhotoKind;
import com.tomurcuk.shared.Ids;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/** `media.Photos`'un arkası: görüntüyü hazırlar ve seçili depoya yazar. */
@Component
public class PhotoStorage {

	private static final Logger log = LoggerFactory.getLogger(PhotoStorage.class);

	private static final Pattern COLOR = Pattern.compile("-([0-9a-f]{6})\\.jpg$");

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
		// Kapağın baskın rengi dosya adında taşınır (`<id>-c2456e.jpg`): tema ayrı kayıt tutmadan
		// ve tarayıcının gönderdiği bir renge güvenmeden kapaktan türetilir.
		String suffix = kind == PhotoKind.COVER ? color(jpeg).map(c -> "-" + c.substring(1)).orElse("") : "";
		return Optional.of(store.put(Ids.newId().toLowerCase(Locale.ROOT) + suffix + ".jpg", jpeg));
	}

	/** Depodaki kapak adresinden baskın renk ("#c2456e"); renk taşımayan adreste boş. */
	public Optional<String> coverColor(String url) {
		if (url == null || !owns(url)) {
			return Optional.empty();
		}
		Matcher m = COLOR.matcher(url);
		return m.find() ? Optional.of("#" + m.group(1)) : Optional.empty();
	}

	private static Optional<String> color(byte[] jpeg) {
		try {
			BufferedImage image = ImageIO.read(new ByteArrayInputStream(jpeg));
			return image == null ? Optional.empty() : PhotoColors.dominant(image);
		}
		catch (IOException ex) {
			return Optional.empty();
		}
	}

	public boolean owns(String url) {
		return store.owns(url);
	}
}
