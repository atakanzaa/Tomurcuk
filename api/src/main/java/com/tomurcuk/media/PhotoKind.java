package com.tomurcuk.media;

/**
 * Yüklenen fotoğrafın kullanıldığı yer; oranı ve en büyük ölçüsü buna göre. `ratioW` 0 ise
 * kırpılmaz, uzun kenar `maxSide`'a küçültülür.
 */
public enum PhotoKind {

	/** Ürün fotoğrafı, 4:5. */
	PRODUCT(4, 5, 1200),

	/** Dükkânın kapak fotoğrafı, 3:2. */
	COVER(3, 2, 1800),

	/** Logo ve atölye fotoğrafları, kare. */
	SQUARE(1, 1, 1000),

	/** Teslim fotoğrafı; oranı korunur. */
	DELIVERY(0, 0, 1600);

	private final int ratioW;

	private final int ratioH;

	private final int maxSide;

	PhotoKind(int ratioW, int ratioH, int maxSide) {
		this.ratioW = ratioW;
		this.ratioH = ratioH;
		this.maxSide = maxSide;
	}

	public int ratioW() {
		return ratioW;
	}

	public int ratioH() {
		return ratioH;
	}

	/** Kırpılan fotoğrafta genişlik, kırpılmayanda uzun kenar. */
	public int maxSide() {
		return maxSide;
	}
}
