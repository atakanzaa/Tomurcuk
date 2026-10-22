import "server-only";
import { cookies } from "next/headers";
import { PANEL_SESSION_COOKIE } from "@/lib/routes";

// Tarayıcıdaki panel oturumu: API'nin oturum kimliği, httpOnly cookie'de. Tarayıcı API'yi hiç
// görmez; Next sunucusu her panel isteğinde bu değeri API'ye kendi cookie'si olarak iletir.
const COOKIE = PANEL_SESSION_COOKIE;
/** API'nin oturum cookie'sinin adı (api: SecurityConfig.SESSION_COOKIE). */
export const API_SESSION_COOKIE = "TOMURCUK_SESSION";

export async function readPanelSession(): Promise<string | null> {
  return (await cookies()).get(COOKIE)?.value ?? null;
}

export async function writePanelSession(value: string) {
  (await cookies()).set(COOKIE, value, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 30 * 24 * 60 * 60,
  });
}

export async function clearPanelSession() {
  (await cookies()).delete(COOKIE);
}
