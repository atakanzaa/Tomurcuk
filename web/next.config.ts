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
};

export default nextConfig;
