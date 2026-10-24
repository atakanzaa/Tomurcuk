package com.tomurcuk.catalog.internal;

import java.net.URI;
import java.nio.file.Path;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.checksums.RequestChecksumCalculation;
import software.amazon.awssdk.core.checksums.ResponseChecksumValidation;
import software.amazon.awssdk.http.urlconnection.UrlConnectionHttpClient;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3Configuration;

/**
 * `tomurcuk.photos.store`: `disk` (varsayılan; yerel, testler, önizleme) ya da `r2`. Yeni fotoğraf
 * seçilen depoya yazılır. Disk deposu her zaman açıktır: R2'ye geçmeden önce diske yüklenmiş
 * fotoğraflar okunmaya devam eder. R2 anahtarları repoya değil sunucudaki `.env`'e girer:
 * TOMURCUK_PHOTOS_R2_ACCESSKEY, TOMURCUK_PHOTOS_R2_SECRETKEY (deploy/README.md).
 */
@Configuration(proxyBeanMethods = false)
class PhotoStoreConfig {

	@Bean
	DiskPhotoStore diskPhotoStore(@Value("${tomurcuk.photos.disk.dir:data/photos}") Path dir) {
		return new DiskPhotoStore(dir);
	}

	@Bean
	@Primary
	@ConditionalOnProperty(name = "tomurcuk.photos.store", havingValue = "r2")
	R2PhotoStore r2PhotoStore(@Value("${tomurcuk.photos.r2.endpoint}") String endpoint,
			@Value("${tomurcuk.photos.r2.bucket}") String bucket,
			@Value("${tomurcuk.photos.r2.access-key}") String accessKey,
			@Value("${tomurcuk.photos.r2.secret-key}") String secretKey,
			@Value("${tomurcuk.photos.r2.public-url}") String publicUrl,
			@Value("${tomurcuk.photos.r2.prefix:}") String prefix) {
		S3Client s3 = S3Client.builder()
			.endpointOverride(URI.create(endpoint))
			// R2'de bölge yok; SDK bir değer istediği için "auto".
			.region(Region.of("auto"))
			.credentialsProvider(StaticCredentialsProvider.create(AwsBasicCredentials.create(accessKey, secretKey)))
			.httpClient(UrlConnectionHttpClient.create())
			// Bucket adı yolda (r2.cloudflarestorage.com/<bucket>/<anahtar>); gövde parçalı (aws-chunked)
			// değil, tek parça gider.
			.serviceConfiguration(S3Configuration.builder()
				.pathStyleAccessEnabled(true)
				.chunkedEncodingEnabled(false)
				.build())
			// SDK'nin varsayılan ek sağlama toplamlarını R2 her işlemde desteklemiyor.
			.requestChecksumCalculation(RequestChecksumCalculation.WHEN_REQUIRED)
			.responseChecksumValidation(ResponseChecksumValidation.WHEN_REQUIRED)
			.build();
		return new R2PhotoStore(s3, bucket, prefix, publicUrl);
	}
}
