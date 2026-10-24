package com.tomurcuk.media.internal;

/**
 * Ürün fotoğraflarının durduğu yer: yerelde ve testlerde disk, staging ve prod'da Cloudflare R2
 * (`tomurcuk.photos.store`). Fotoğraflar herkese açık bir adresten okunur.
 */
interface PhotoStore {

	/** JPEG'i `name` adıyla yazar ve herkese açık adresini döner. */
	String put(String name, byte[] jpeg);

	/** Panelden gelen bir fotoğraf adresi yalnızca bu depodan olabilir. */
	boolean owns(String url);
}
