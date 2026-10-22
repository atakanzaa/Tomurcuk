import { connection } from "next/server";
import { apiUrl } from "@/lib/api/http/client";

// Container sağlık kontrolü ve deploy sonrası smoke test: Next ayakta ve API'ye ulaşıyor mu.
// Yalnızca durum döner; API iç ağda kalır.
export async function GET() {
  await connection();
  try {
    const res = await fetch(apiUrl("/actuator/health"), { cache: "no-store", signal: AbortSignal.timeout(3000) });
    if (res.ok) return Response.json({ status: "UP" });
  } catch {
    // API'ye ulaşılamadı; aşağıda 503.
  }
  return Response.json({ status: "DOWN" }, { status: 503 });
}
