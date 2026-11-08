package com.tomurcuk.shop;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.regex.Pattern;

/**
 * Dükkânın teması: kapak fotoğrafının baskın renginden türetilen açık ve koyu renkler. Anahtarlar
 * design/tomurcuk/tokens.css değişkenleridir (`paper`, `stem`…); vitrin bunları dükkânın
 * sayfalarında Tomurcuk'un renklerinin yerine koyar. Durum renkleri ve `peony` değişmez.
 *
 * Kontrast hesapla sağlanır, her tonda: buton yazısı ve buton/zemin 4.5:1, ikincil metin kraft
 * yüzey üstünde 4.5:1, form kenarlığı 3:1 (ShopThemeTests bütün tonları dener).
 */
public record ShopTheme(String source, Map<String, String> light, Map<String, String> dark) {

	private static final Pattern HEX = Pattern.compile("#[0-9a-fA-F]{6}");

	/** `color` "#rrggbb"; geçersizse null. */
	public static ShopTheme from(String color) {
		if (color == null || !HEX.matcher(color).matches()) {
			return null;
		}
		double[] hsl = hsl(color);
		return new ShopTheme(color.toLowerCase(), light(hsl[0], hsl[1]), dark(hsl[0], hsl[1]));
	}

	private static Map<String, String> light(double h, double s) {
		double tint = Math.min(s, 0.45);
		double accentS = clamp(s, 0.35, 0.55);
		String paper = hex(h, tint * 0.6, 0.955);
		String kraft = hex(h, tint * 0.75, 0.875);
		String onStem = "#fbf8f2";
		double l = 0.42;
		while (l > 0.1 && (contrast(hex(h, accentS, l), onStem) < 4.8 || contrast(hex(h, accentS, l), paper) < 4.5)) {
			l -= 0.01;
		}
		String stem = hex(h, accentS, l);
		Map<String, String> out = new LinkedHashMap<>();
		out.put("paper", paper);
		out.put("paper-raised", hex(h, tint * 0.5, 0.982));
		out.put("kraft", kraft);
		out.put("kraft-deep", hex(h, tint * 0.6, 0.76));
		out.put("line", hex(h, 0.2, 0.83));
		out.put("line-strong", darkest(h, 0.10, 0.52, paper, 3.1));
		out.put("ink", hex(h, 0.14, 0.13));
		out.put("ink-muted", darkest(h, 0.10, 0.38, kraft, 4.6));
		out.put("stem", stem);
		out.put("stem-hover", hex(h, accentS, l - 0.06));
		out.put("on-stem", onStem);
		return out;
	}

	private static Map<String, String> dark(double h, double s) {
		double tint = Math.min(s, 0.45);
		double accentS = clamp(s, 0.35, 0.55);
		String paper = hex(h, tint * 0.35, 0.10);
		String kraft = hex(h, tint * 0.4, 0.19);
		String onStem = hex(h, 0.25, 0.09);
		double l = 0.66;
		while (l < 0.95 && (contrast(hex(h, accentS, l), onStem) < 4.8 || contrast(hex(h, accentS, l), paper) < 4.5)) {
			l += 0.01;
		}
		Map<String, String> out = new LinkedHashMap<>();
		out.put("paper", paper);
		out.put("paper-raised", hex(h, tint * 0.35, 0.135));
		out.put("kraft", kraft);
		out.put("kraft-deep", hex(h, tint * 0.4, 0.29));
		out.put("line", hex(h, 0.12, 0.23));
		out.put("line-strong", lightest(h, 0.10, 0.48, paper, 3.1));
		out.put("ink", hex(h, 0.18, 0.92));
		out.put("ink-muted", lightest(h, 0.10, 0.68, kraft, 4.6));
		out.put("stem", hex(h, accentS, l));
		out.put("stem-hover", hex(h, accentS, Math.min(0.95, l + 0.06)));
		out.put("on-stem", onStem);
		return out;
	}

	/** `from` açıklığından başlayıp `against` ile en az `ratio` kontrast verene kadar koyulaşır. */
	private static String darkest(double h, double s, double from, String against, double ratio) {
		double l = from;
		while (l > 0.05 && contrast(hex(h, s, l), against) < ratio) {
			l -= 0.01;
		}
		return hex(h, s, l);
	}

	private static String lightest(double h, double s, double from, String against, double ratio) {
		double l = from;
		while (l < 0.95 && contrast(hex(h, s, l), against) < ratio) {
			l += 0.01;
		}
		return hex(h, s, l);
	}

	private static double clamp(double v, double min, double max) {
		return Math.max(min, Math.min(max, v));
	}

	/** WCAG kontrast oranı. */
	static double contrast(String a, String b) {
		double la = luminance(a);
		double lb = luminance(b);
		return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
	}

	private static double luminance(String hex) {
		double[] c = new double[3];
		for (int i = 0; i < 3; i++) {
			double v = Integer.parseInt(hex.substring(1 + i * 2, 3 + i * 2), 16) / 255.0;
			c[i] = v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
		}
		return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
	}

	static double[] hsl(String hex) {
		double r = Integer.parseInt(hex.substring(1, 3), 16) / 255.0;
		double g = Integer.parseInt(hex.substring(3, 5), 16) / 255.0;
		double b = Integer.parseInt(hex.substring(5, 7), 16) / 255.0;
		double max = Math.max(r, Math.max(g, b));
		double min = Math.min(r, Math.min(g, b));
		double l = (max + min) / 2;
		if (max == min) {
			return new double[] { 0, 0, l };
		}
		double d = max - min;
		double s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
		double h;
		if (max == r) {
			h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
		}
		else if (max == g) {
			h = ((b - r) / d + 2) * 60;
		}
		else {
			h = ((r - g) / d + 4) * 60;
		}
		return new double[] { h, s, l };
	}

	static String hex(double h, double s, double l) {
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
