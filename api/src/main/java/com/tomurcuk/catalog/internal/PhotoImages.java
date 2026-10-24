package com.tomurcuk.catalog.internal;

import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.Iterator;
import java.util.Set;

import javax.imageio.IIOImage;
import javax.imageio.ImageIO;
import javax.imageio.ImageReader;
import javax.imageio.ImageWriteParam;
import javax.imageio.ImageWriter;
import javax.imageio.stream.ImageInputStream;
import javax.imageio.stream.ImageOutputStream;

/**
 * Yüklenen fotoğrafı vitrine hazırlar: ortadan 4:5 kırpar, en çok 1200×1500'e küçültür ve JPEG
 * olarak yeniden yazar. Yeniden yazmak konum gibi EXIF bilgilerini de siler. Telefonun döndürme
 * bilgisini tarayıcı uygular; panel fotoğrafı yüklemeden önce kırpıp JPEG'e çevirir.
 */
final class PhotoImages {

	static final int WIDTH = 1200;

	static final int HEIGHT = 1500;

	static final int MAX_BYTES = 8 * 1024 * 1024;

	private static final Set<String> FORMATS = Set.of("jpeg", "png");

	private static final long MAX_PIXELS = 50_000_000L;

	private static final int MIN_SIDE = 300;

	private PhotoImages() {
	}

	static class InvalidPhoto extends Exception {

		InvalidPhoto(String message) {
			super(message);
		}
	}

	static byte[] toProductJpeg(byte[] input) throws InvalidPhoto {
		if (input.length == 0 || input.length > MAX_BYTES) {
			throw new InvalidPhoto("Boyut uygun değil: " + input.length);
		}
		BufferedImage source = read(input);
		int w = source.getWidth();
		int h = source.getHeight();
		// 4:5'e ortadan kırp.
		int cropW = w;
		int cropH = h;
		if (w * 5 > h * 4) {
			cropW = h * 4 / 5;
		}
		else {
			cropH = w * 5 / 4;
		}
		int x = (w - cropW) / 2;
		int y = (h - cropH) / 2;
		int outW = Math.min(WIDTH, cropW);
		int outH = outW * 5 / 4;
		BufferedImage out = new BufferedImage(outW, outH, BufferedImage.TYPE_INT_RGB);
		Graphics2D g = out.createGraphics();
		try {
			g.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BICUBIC);
			g.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
			g.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
			// Saydam PNG'nin zemini beyaz olur.
			g.setColor(Color.WHITE);
			g.fillRect(0, 0, outW, outH);
			g.drawImage(halve(source.getSubimage(x, y, cropW, cropH), outW), 0, 0, outW, outH, null);
		}
		finally {
			g.dispose();
		}
		return writeJpeg(out);
	}

	private static BufferedImage read(byte[] input) throws InvalidPhoto {
		try (ImageInputStream stream = ImageIO.createImageInputStream(new ByteArrayInputStream(input))) {
			Iterator<ImageReader> readers = ImageIO.getImageReaders(stream);
			if (!readers.hasNext()) {
				throw new InvalidPhoto("Görüntü değil");
			}
			ImageReader reader = readers.next();
			try {
				if (!FORMATS.contains(reader.getFormatName().toLowerCase())) {
					throw new InvalidPhoto("Biçim desteklenmiyor: " + reader.getFormatName());
				}
				reader.setInput(stream, true, true);
				int w = reader.getWidth(0);
				int h = reader.getHeight(0);
				// Çözmeden önce boyut: çok büyük görüntü belleği doldurmasın.
				if ((long) w * h > MAX_PIXELS || Math.min(w, h) < MIN_SIDE) {
					throw new InvalidPhoto("Ölçü uygun değil: " + w + "x" + h);
				}
				return reader.read(0);
			}
			finally {
				reader.dispose();
			}
		}
		catch (IOException | RuntimeException ex) {
			throw new InvalidPhoto("Okunamadı: " + ex.getMessage());
		}
	}

	/** Büyük görüntüyü yarıya yarıya küçültür; tek adımda küçültmek kenarları tırtıklı yapar. */
	private static BufferedImage halve(BufferedImage image, int targetWidth) {
		BufferedImage current = image;
		while (current.getWidth() / 2 >= targetWidth) {
			int w = current.getWidth() / 2;
			int h = current.getHeight() / 2;
			BufferedImage next = new BufferedImage(w, h, BufferedImage.TYPE_INT_RGB);
			Graphics2D g = next.createGraphics();
			try {
				g.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
				g.setColor(Color.WHITE);
				g.fillRect(0, 0, w, h);
				g.drawImage(current, 0, 0, w, h, null);
			}
			finally {
				g.dispose();
			}
			current = next;
		}
		return current;
	}

	private static byte[] writeJpeg(BufferedImage image) {
		ImageWriter writer = ImageIO.getImageWritersByFormatName("jpeg").next();
		ByteArrayOutputStream bytes = new ByteArrayOutputStream();
		try (ImageOutputStream out = ImageIO.createImageOutputStream(bytes)) {
			writer.setOutput(out);
			ImageWriteParam param = writer.getDefaultWriteParam();
			param.setCompressionMode(ImageWriteParam.MODE_EXPLICIT);
			param.setCompressionQuality(0.85f);
			writer.write(null, new IIOImage(image, null, null), param);
		}
		catch (IOException ex) {
			throw new IllegalStateException(ex);
		}
		finally {
			writer.dispose();
		}
		return bytes.toByteArray();
	}
}
