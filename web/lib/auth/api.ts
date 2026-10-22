import "server-only";
import { apiUrl } from "@/lib/api/http/client";
import { API_SESSION_COOKIE, readSession, type SessionKind } from "./cookie";

const LOGIN_PATHS: Record<SessionKind, string> = {
  panel: "/api/panel/auth/login",
  support: "/api/support/auth/login",
};

/**
 * Giriş. API oturumu açar ve kimliğini Set-Cookie'de döner; değer tarayıcıya Next'in kendi
 * cookie'siyle geçer. Yanlış bilgide (422) null; hangisinin yanlış olduğu söylenmez.
 */
export async function loginToApi(kind: SessionKind, body: Record<string, string>): Promise<{ session: string } | null> {
  const response = await fetch(apiUrl(LOGIN_PATHS[kind]), {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
  });
  if (response.status === 422) return null;
  if (!response.ok) throw new Error(`Giriş yapılamadı: API ${response.status}`);
  const session = response.headers
    .getSetCookie()
    .map((c) => c.split(";")[0])
    .find((c) => c.startsWith(`${API_SESSION_COOKIE}=`))
    ?.slice(API_SESSION_COOKIE.length + 1);
  if (!session) throw new Error("Giriş yapılamadı: API oturum cookie'si dönmedi");
  return { session };
}

export async function logoutFromApi(kind: SessionKind) {
  const session = await readSession(kind);
  if (!session) return;
  await fetch(apiUrl(`/api/${kind}/auth/logout`), {
    method: "POST",
    headers: { Cookie: `${API_SESSION_COOKIE}=${session}` },
  }).catch(() => undefined);
}
