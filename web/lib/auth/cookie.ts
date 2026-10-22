import "server-only";
import { cookies } from "next/headers";
import { IMPERSONATION_COOKIE, PANEL_SESSION_COOKIE, SUPPORT_SESSION_COOKIE } from "@/lib/routes";

// Tarayıcıdaki oturumlar: API'nin oturum kimliği, httpOnly cookie'lerde. Tarayıcı API'yi hiç
// görmez; Next sunucusu her istekte bu değeri API'ye kendi cookie'si olarak iletir. Panel ve
// destek oturumları ayrı cookie'lerdedir.

/** API'nin oturum cookie'sinin adı (api: SecurityConfig.SESSION_COOKIE). */
export const API_SESSION_COOKIE = "TOMURCUK_SESSION";

export type SessionKind = "panel" | "support";

const NAMES: Record<SessionKind, string> = { panel: PANEL_SESSION_COOKIE, support: SUPPORT_SESSION_COOKIE };

const options = (kind: SessionKind) => ({
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  // Destek oturumu iş günü sonunda biter; panel telefonda açık kalır.
  maxAge: kind === "panel" ? 30 * 24 * 60 * 60 : 12 * 60 * 60,
});

export async function readSession(kind: SessionKind): Promise<string | null> {
  return (await cookies()).get(NAMES[kind])?.value ?? null;
}

export async function writeSession(kind: SessionKind, value: string) {
  (await cookies()).set(NAMES[kind], value, options(kind));
}

export async function clearSession(kind: SessionKind) {
  (await cookies()).delete(NAMES[kind]);
}

/** Destek ekibinin dükkân adına açtığı oturum; varsa panel istekleri bu oturumla gider. */
export async function readImpersonation(): Promise<string | null> {
  return (await cookies()).get(IMPERSONATION_COOKIE)?.value ?? null;
}

export async function writeImpersonation(id: string, endsAt: string) {
  (await cookies()).set(IMPERSONATION_COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(endsAt),
  });
}

export async function clearImpersonation() {
  (await cookies()).delete(IMPERSONATION_COOKIE);
}
