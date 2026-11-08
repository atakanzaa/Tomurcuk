package com.tomurcuk.media.internal;

import java.awt.image.BufferedImage;
import java.util.Optional;

/**
 * Fotoğrafın baskın rengi: dükkânın teması kapak fotoğrafından türetilir. Gri, çok koyu ve
 * çok açık pikseller sayılmaz; kalanlar tonlarına göre 36 kutuya ayrılır, doygunluğa göre
 * tartılır ve komşularıyla birlikte en ağır kutunun ortalama tonu seçilir. Renkli piksel
 * yoksa (siyah beyaz fotoğraf) boş döner.
 */
final class PhotoColors {

	private static final int BINS = 36;

	private PhotoColors() {
	}

	/** "#rrggbb", tonu ve doygunluğu fotoğraftan, açıklığı 0,5. */
	static Optional<String> dominant(BufferedImage image) {
		int w = image.getWidth();
		int h = image.getHeight();
		int step = Math.max(1, Math.max(w, h) / 96);
		double[] weight = new double[BINS];
		double[] cos = new double[BINS];
		double[] sin = new double[BINS];
		double[] sat = new double[BINS];
		int samples = 0;
		for (int y = 0; y < h; y += step) {
			for (int x = 0; x < w; x += step) {
				samples++;
				double[] hsl = hsl(image.getRGB(x, y));
				double s = hsl[1];
				double l = hsl[2];
				if (s < 0.18 || l < 0.15 || l > 0.9) {
					continue;
				}
				double wgt = s * (1 - Math.abs(l - 0.5) * 1.4);
				int bin = (int) (hsl[0] / (360.0 / BINS)) % BINS;
				weight[bin] += wgt;
				cos[bin] += Math.cos(Math.toRadians(hsl[0])) * wgt;
				sin[bin] += Math.sin(Math.toRadians(hsl[0])) * wgt;
				sat[bin] += s * wgt;
			}
		}
		int best = -1;
		double bestWeight = 0;
		for (int i = 0; i < BINS; i++) {
			double around = weight[(i + BINS - 1) % BINS] + weight[i] + weight[(i + 1) % BINS];
			if (around > bestWeight) {
				bestWeight = around;
				best = i;
			}
		}
		// Renkli alan fotoğrafın %3'ünden azsa (çoğu gri) tema varsayılan kalır.
		if (best < 0 || bestWeight < samples * 0.03 * 0.3) {
			return Optional.empty();
		}
		double c = 0;
		double sn = 0;
		double s = 0;
		double wsum = 0;
		for (int d = -1; d <= 1; d++) {
			int i = (best + d + BINS) % BINS;
			c += cos[i];
			sn += sin[i];
			s += sat[i];
			wsum += weight[i];
		}
		double hue = (Math.toDegrees(Math.atan2(sn, c)) + 360) % 360;
		double saturation = Math.max(0.25, Math.min(0.75, s / wsum));
		return Optional.of(hex(hue, saturation, 0.5));
	}

	private static double[] hsl(int rgb) {
		double r = ((rgb >> 16) & 0xff) / 255.0;
		double g = ((rgb >> 8) & 0xff) / 255.0;
		double b = (rgb & 0xff) / 255.0;
		double max = Math.max(r, Math.max(g, b));
		double min = Math.min(r, Math.min(g, b));
		double l = (max + min) / 2;
		if (max == min) {
			return new double[] { 0, 0, l };
		}
		double d = max - min;
		double s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
		double hue;
		if (max == r) {
			hue = ((g - b) / d + (g < b ? 6 : 0)) * 60;
		}
		else if (max == g) {
			hue = ((b - r) / d + 2) * 60;
		}
		else {
			hue = ((r - g) / d + 4) * 60;
		}
		return new double[] { hue, s, l };
	}

	private static String hex(double h, double s, double l) {
		double c = (1 - Math.abs(2 * l - 1)) * s;
		double x = c * (1 - Math.abs((h / 60) % 2 - 1));
		double m = l - c / 2;
		double[] rgb = h < 60 ? new double[] { c, x, 0 } : h < 120 ? new double[] { x, c, 0 }
				: h < 180 ? new double[] { 0, c, x } : h < 240 ? new double[] { 0, x, c }
						: h < 300 ? new double[] { x, 0, c } : new double[] { c, 0, x };
		return String.format("#%02x%02x%02x", Math.round((rgb[0] + m) * 255), Math.round((rgb[1] + m) * 255),
				Math.round((rgb[2] + m) * 255));
	}
}
