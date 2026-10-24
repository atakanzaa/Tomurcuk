import { connection } from "next/server";
import { apiUrl, path } from "@/lib/api/http/client";

// Fotoğraflar API'nin diskindeyse (yerel ve R2 kurulmamış sunucular) buradan aktarılır; tarayıcı
// API'ye gitmez. R2'de fotoğraf adresi doğrudan R2'nin herkese açık adresidir.
export async function GET(_request: Request, { params }: RouteContext<"/foto/[name]">) {
  await connection();
  const { name } = await params;
  const res = await fetch(apiUrl(path`/api/public/photos/${name}`), { cache: "no-store" });
  if (!res.ok) return new Response(null, { status: 404 });
  return new Response(res.body, {
    headers: {
      "Content-Type": "image/jpeg",
      // Adı tahmin edilemez ve içeriği değişmez.
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
