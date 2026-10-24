package com.tomurcuk.media.internal;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Optional;
import java.util.regex.Pattern;

/**
 * Fotoğraflar sunucunun diskinde. Tarayıcı API'ye gitmediği için adres frontend'in yoludur
 * (`/foto/<ad>`); frontend dosyayı `GET /api/public/photos/<ad>` ile alır.
 */
class DiskPhotoStore implements PhotoStore {

	static final String URL_PREFIX = "/foto/";

	private static final Pattern NAME = Pattern.compile("[A-Za-z0-9]{10,40}\\.jpg");

	private final Path dir;

	DiskPhotoStore(Path dir) {
		this.dir = dir;
	}

	@Override
	public String put(String name, byte[] jpeg) {
		try {
			Files.createDirectories(dir);
			Files.write(dir.resolve(name), jpeg);
		}
		catch (IOException ex) {
			throw new UncheckedIOException(ex);
		}
		return URL_PREFIX + name;
	}

	@Override
	public boolean owns(String url) {
		return url.startsWith(URL_PREFIX) && NAME.matcher(url.substring(URL_PREFIX.length())).matches();
	}

	/** Ad doğrulanır; dizin dışına çıkan yol okunmaz. */
	Optional<byte[]> read(String name) {
		if (!NAME.matcher(name).matches()) {
			return Optional.empty();
		}
		Path file = dir.resolve(name);
		try {
			return Files.exists(file) ? Optional.of(Files.readAllBytes(file)) : Optional.empty();
		}
		catch (IOException ex) {
			throw new UncheckedIOException(ex);
		}
	}
}
