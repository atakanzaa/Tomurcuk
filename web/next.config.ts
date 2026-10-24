import path from "node:path";
import type { NextConfig } from "next";

// Design system repo kökündeki design/ klasöründe; Turbopack'in onu çözebilmesi için kök bir üst dizin.
const repoRoot = path.join(__dirname, "..");

const nextConfig: NextConfig = {
  // Docker image'ı yalnızca çalışması gereken dosyaları taşır (web/Dockerfile).
  output: "standalone",
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: { root: repoRoot },
  outputFileTracingRoot: repoRoot,
  images: {
    // Ürün fotoğrafları: R2 kurulmamış ortamda API'nin diskinden /foto/ yolu, kurulmuşsa R2'nin
    // herkese açık adresi (önce r2.dev, sonra kendi alan adımız).
    localPatterns: [{ pathname: "/foto/**", search: "" }],
    remotePatterns: [
      { protocol: "https", hostname: "*.r2.dev", pathname: "/**", search: "" },
      { protocol: "https", hostname: "foto.tomurcuk.shop", pathname: "/**", search: "" },
    ],
  },
  experimental: {
    // Panelde tek fotoğraf Server Action ile yüklenir; tarayıcı küçültür ama açamadığı biçim
    // olduğu gibi gelir (API sınırı 8 MB).
    serverActions: { bodySizeLimit: "9mb" },
  },
};

export default nextConfig;
