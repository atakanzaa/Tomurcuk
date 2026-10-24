package com.tomurcuk.delivery;

import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.json.JsonMapper;

/**
 * İstanbul'un ilçe ve mahalleleri (resources/places/istanbul.json, kaynağı NOTICE.txt'te). Teslim
 * bölgeleri bu listeden seçilir; alıcı ana sayfası bölgeleri adıyla eşleştirdiği için yazım
 * farkı dükkânları birbirinden ayırmasın.
 */
@Service
public class Places {

	private final Map<String, List<String>> istanbul;

	Places(JsonMapper json) {
		try (InputStream in = Places.class.getResourceAsStream("/places/istanbul.json")) {
			this.istanbul = json.readValue(in, new TypeReference<LinkedHashMap<String, List<String>>>() {
			});
		}
		catch (IOException ex) {
			throw new UncheckedIOException(ex);
		}
	}

	/** İlçe → mahalleler; ilçeler ve mahalleler Türkçe alfabe sırasıyla. */
	public Map<String, List<String>> istanbul() {
		return istanbul;
	}

	/** Mahalle boşsa bütün ilçe. */
	public boolean contains(String district, String neighborhood) {
		List<String> neighborhoods = istanbul.get(district);
		return neighborhoods != null && (neighborhood == null || neighborhoods.contains(neighborhood));
	}
}
