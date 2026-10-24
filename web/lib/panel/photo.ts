// Tarayıcıda fotoğrafı yüklemeden önce hazırlar: telefonun döndürme bilgisini uygular, küçültür ve
// JPEG yapar. Yükleme küçülür, konum gibi EXIF bilgileri tarayıcıdan çıkmaz. Sunucu aynı işi
// yeniden yapar (api PhotoImages). Ürün fotoğrafı ortadan 4:5 kırpılır, en çok 1200×1500; teslim
// fotoğrafı kırpılmaz, uzun kenarı en çok 1600.

const WIDTH = 1200;

const DELIVERY_LONG_SIDE = 1600;

type Crop = { x: number; y: number; w: number; h: number; outW: number; outH: number };

async function toJpeg(file: File, crop: (width: number, height: number) => Crop): Promise<Blob> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    // Tarayıcının açamadığı biçim (ör. masaüstünde HEIC): olduğu gibi gider, sunucu karar verir.
    return file;
  }
  const { x, y, w, h, outW, outH } = crop(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = outW;
  canvas.height = outH;
  const context = canvas.getContext("2d");
  if (!context) {
    bitmap.close();
    return file;
  }
  // Saydam PNG'nin zemini beyaz olur.
  context.fillStyle = "white";
  context.fillRect(0, 0, outW, outH);
  context.imageSmoothingQuality = "high";
  context.drawImage(bitmap, x, y, w, h, 0, 0, outW, outH);
  bitmap.close();
  return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob ?? file), "image/jpeg", 0.88));
}

export function toProductJpeg(file: File): Promise<Blob> {
  return toJpeg(file, (width, height) => {
    let w = width;
    let h = height;
    if (width * 5 > height * 4) w = Math.round((height * 4) / 5);
    else h = Math.round((width * 5) / 4);
    const outW = Math.min(WIDTH, w);
    return { x: (width - w) / 2, y: (height - h) / 2, w, h, outW, outH: Math.round((outW * 5) / 4) };
  });
}

export function toDeliveryJpeg(file: File): Promise<Blob> {
  return toJpeg(file, (width, height) => {
    const ratio = Math.min(1, DELIVERY_LONG_SIDE / Math.max(width, height));
    return { x: 0, y: 0, w: width, h: height, outW: Math.round(width * ratio), outH: Math.round(height * ratio) };
  });
}
