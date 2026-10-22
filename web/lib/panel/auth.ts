import "server-only";
import { apiUrl } from "@/lib/api/http/client";
import { API_SESSION_COOKIE, readPanelSession } from "./cookie";

/**
 * Panele giriş. API oturumu açar ve kimliğini Set-Cookie'de döner; değer tarayıcıya Next'in
 * kendi cookie'siyle geçer. Yanlış bilgide hangisinin yanlış olduğu söylenmez.
 */
export async function loginToApi(email: string, password: string): Promise<{ session: string } | null> {
  const response = await fetch(apiUrl("/api/panel/auth/login"), {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ email, password }),
    cache: "no-store",
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

export async function logoutFromApi() {
  const session = await readPanelSession();
  if (!session) return;
  await fetch(apiUrl("/api/panel/auth/logout"), {
    method: "POST",
    headers: { Cookie: `${API_SESSION_COOKIE}=${session}` },
    cache: "no-store",
  }).catch(() => undefined);
}
