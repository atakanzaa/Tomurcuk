// Tarayıcıda fotoğrafı yüklemeden önce hazırlar: telefonun döndürme bilgisini uygular, ortadan
// 4:5 kırpar, en çok 1200×1500'e küçültür ve JPEG yapar. Yükleme küçülür, konum gibi EXIF
// bilgileri tarayıcıdan çıkmaz. Sunucu aynı işi yeniden yapar (api PhotoImages).

const WIDTH = 1200;

export async function toProductJpeg(file: File): Promise<Blob> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    // Tarayıcının açamadığı biçim (ör. masaüstünde HEIC): olduğu gibi gider, sunucu karar verir.
    return file;
  }
  const { width, height } = bitmap;
  let cropW = width;
  let cropH = height;
  if (width * 5 > height * 4) cropW = Math.round((height * 4) / 5);
  else cropH = Math.round((width * 5) / 4);
  const outW = Math.min(WIDTH, cropW);
  const outH = Math.round((outW * 5) / 4);
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
  context.drawImage(bitmap, (width - cropW) / 2, (height - cropH) / 2, cropW, cropH, 0, 0, outW, outH);
  bitmap.close();
  return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob ?? file), "image/jpeg", 0.88));
}
