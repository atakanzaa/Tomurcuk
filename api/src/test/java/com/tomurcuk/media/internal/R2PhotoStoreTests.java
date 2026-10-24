package com.tomurcuk.media.internal;

import static org.assertj.core.api.Assertions.assertThat;

import java.net.InetSocketAddress;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import com.sun.net.httpserver.HttpServer;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

/** R2'ye giden isteğin biçimi, R2'ye bağlanmadan: yol, başlıklar, imza ve dönen adres. */
class R2PhotoStoreTests {

	private HttpServer server;

	private final Map<String, String> seen = new ConcurrentHashMap<>();

	@BeforeEach
	void start() throws Exception {
		server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
		server.createContext("/", exchange -> {
			seen.put("method", exchange.getRequestMethod());
			seen.put("path", exchange.getRequestURI().getPath());
			exchange.getRequestHeaders().forEach((name, values) -> seen.put(name.toLowerCase(), values.getFirst()));
			seen.put("bodyLength", String.valueOf(exchange.getRequestBody().readAllBytes().length));
			exchange.getResponseHeaders().add("ETag", "\"etag\"");
			exchange.sendResponseHeaders(200, -1);
			exchange.close();
		});
		server.start();
	}

	@AfterEach
	void stop() {
		server.stop(0);
	}

	@Test
	void putsJpegUnderPrefixAndReturnsPublicUrl() {
		R2PhotoStore store = new PhotoStoreConfig().r2PhotoStore(
				"http://127.0.0.1:" + server.getAddress().getPort(), "tomurcuk", "erisim", "gizli",
				"https://pub-ornek.r2.dev", "staging");

		String url = store.put("01abc.jpg", new byte[] { 1, 2, 3 });

		assertThat(url).isEqualTo("https://pub-ornek.r2.dev/staging/01abc.jpg");
		assertThat(seen).containsEntry("method", "PUT")
			.containsEntry("path", "/tomurcuk/staging/01abc.jpg")
			.containsEntry("content-type", "image/jpeg")
			.containsEntry("cache-control", "public, max-age=31536000, immutable")
			.containsEntry("bodyLength", "3");
		assertThat(seen.get("authorization")).startsWith("AWS4-HMAC-SHA256 Credential=erisim/")
			.contains("/auto/s3/aws4_request");
		// R2 her işlemde desteklemediği için SDK'nin ek sağlama toplamı gönderilmez.
		assertThat(seen.keySet()).noneMatch(name -> name.startsWith("x-amz-checksum")
				|| name.equals("x-amz-sdk-checksum-algorithm"));
		assertThat(store.owns(url)).isTrue();
		assertThat(store.owns("https://pub-ornek.r2.dev/prod/01abc.jpg")).isFalse();
		assertThat(store.owns("https://baska.example/staging/01abc.jpg")).isFalse();
	}
}
