package com.tomurcuk.media.internal;

import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

/**
 * Cloudflare R2 (S3 uyumlu). Her ortam aynı bucket'ta kendi önekini kullanır (`staging/`,
 * `prod/`); fotoğraf bucket'ın herkese açık adresinden okunur. Dosya adı tahmin edilemez ve
 * değişmez, bu yüzden bir yıl önbellekte kalabilir.
 */
class R2PhotoStore implements PhotoStore {

	private final S3Client s3;

	private final String bucket;

	private final String prefix;

	private final String publicUrl;

	R2PhotoStore(S3Client s3, String bucket, String prefix, String publicUrl) {
		this.s3 = s3;
		this.bucket = bucket;
		this.prefix = prefix.isEmpty() || prefix.endsWith("/") ? prefix : prefix + "/";
		this.publicUrl = publicUrl.endsWith("/") ? publicUrl : publicUrl + "/";
	}

	@Override
	public String put(String name, byte[] jpeg) {
		String key = prefix + name;
		s3.putObject(PutObjectRequest.builder()
			.bucket(bucket)
			.key(key)
			.contentType("image/jpeg")
			.cacheControl("public, max-age=31536000, immutable")
			.build(), RequestBody.fromBytes(jpeg));
		return publicUrl + key;
	}

	@Override
	public boolean owns(String url) {
		return url.startsWith(publicUrl + prefix) && url.endsWith(".jpg") && !url.contains("..");
	}
}
