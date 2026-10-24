import "server-only";
import { redirect } from "next/navigation";
import { API_SESSION_COOKIE, readImpersonation, readSession } from "@/lib/auth/cookie";
import { LOGIN_PATH, SUPPORT_HOME_PATH, SUPPORT_LOGIN_PATH } from "@/lib/routes";
import type { FieldErrors, Result } from "../types";

// API iç ağdadır; tarayıcı onu hiç görmez. Yalnızca Server Component'ler, Server Action'lar,
// route handler'lar ve proxy buradan çağırır.
const API_URL = process.env.TOMURCUK_API_URL ?? "http://localhost:8080";

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly path: string,
  ) {
    super(`API ${status}: ${path}`);
    this.name = "ApiError";
  }
}

/** Yol parçalarını kodlar: path`/shops/${id}` → "/shops/a%2Fb". */
export function path(strings: TemplateStringsArray, ...values: string[]): string {
  return strings.reduce((out, part, i) => out + part + (i < values.length ? encodeURIComponent(values[i]) : ""), "");
}

export const apiUrl = (path: string) => `${API_URL}${path}`;

/**
 * Hangi oturumla gidileceği: destek uçları destek oturumuyla; panel uçları dükkân oturumuyla ya
 * da destek ekibi dükkân adına girdiyse destek oturumu ve dükkân adına oturumun kimliğiyle.
 * Herkese açık uçlar oturumsuz.
 */
interface Credentials {
  headers: Record<string, string>;
  login: string;
  impersonating: boolean;
}

async function credentials(path: string): Promise<Credentials | null> {
  if (path.startsWith("/api/support/")) {
    const session = await readSession("support");
    if (!session) redirect(SUPPORT_LOGIN_PATH);
    return { headers: { Cookie: `${API_SESSION_COOKIE}=${session}` }, login: SUPPORT_LOGIN_PATH, impersonating: false };
  }
  if (path.startsWith("/api/panel/")) {
    const [impersonation, support] = [await readImpersonation(), await readSession("support")];
    if (impersonation && support) {
      return {
        headers: { Cookie: `${API_SESSION_COOKIE}=${support}`, "X-Tomurcuk-Impersonation": impersonation },
        login: SUPPORT_LOGIN_PATH,
        impersonating: true,
      };
    }
    const session = await readSession("panel");
    if (!session) redirect(LOGIN_PATH);
    return { headers: { Cookie: `${API_SESSION_COOKIE}=${session}` }, login: LOGIN_PATH, impersonating: false };
  }
  return null;
}

/**
 * Oturum yoksa ya da süresi dolduysa (401) kullanıcı ilgili giriş sayfasına gider. FormData
 * çok parçalı gider (fotoğraf); sınırı fetch yazar.
 */
async function request(method: string, path: string, body?: unknown): Promise<Response> {
  const auth = await credentials(path);
  const multipart = body instanceof FormData;
  const response = await fetch(apiUrl(path), {
    method,
    headers: {
      Accept: "application/json",
      ...(body === undefined || multipart ? {} : { "Content-Type": "application/json" }),
      ...auth?.headers,
    },
    body: body === undefined ? undefined : multipart ? body : JSON.stringify(body),
  });
  if (auth && response.status === 401) redirect(auth.login);
  // Dükkân adına oturumun süresi dolduysa panel yetkisi yoktur; temsilci destek paneline döner.
  if (auth?.impersonating && response.status === 403) redirect(SUPPORT_HOME_PATH);
  return response;
}

export async function get<T>(path: string): Promise<T> {
  const response = await request("GET", path);
  if (!response.ok) throw new ApiError(response.status, path);
  return (await response.json()) as T;
}

/** Kayıt yoksa (404) null; başka dükkânın kaydı da 404 döner. */
export async function getOrNull<T>(path: string): Promise<T | null> {
  const response = await request("GET", path);
  if (response.status === 404) return null;
  if (!response.ok) throw new ApiError(response.status, path);
  return (await response.json()) as T;
}

/** 404'te null döner; diğer hatalar fırlatılır. */
export async function postOrNull<T>(path: string, body: unknown): Promise<T | null> {
  const response = await request("POST", path, body);
  if (response.status === 404) return null;
  if (!response.ok) throw new ApiError(response.status, path);
  return (await response.json()) as T;
}

/**
 * Doğrulama hatası 422 ve `{"errors": {"alan": {"code", "meta"}}}` olarak gelir; frontend'in
 * `Result` tipine çevrilir. Türkçe mesajı arayüz üretir.
 */
export async function send<T, F extends string>(method: "POST" | "PUT", path: string, body: unknown): Promise<Result<T, F>> {
  const result = await sendOrNull<T, F>(method, path, body);
  if (!result) throw new ApiError(404, path);
  return result;
}

/** `send` gibi; kayıt yoksa (404) null. */
export async function sendOrNull<T, F extends string>(
  method: "POST" | "PUT",
  path: string,
  body: unknown,
): Promise<Result<T, F> | null> {
  const response = await request(method, path, body);
  if (response.status === 404) return null;
  if (response.status === 422) {
    const { errors } = (await response.json()) as { errors: FieldErrors<F> };
    return { ok: false, errors };
  }
  if (!response.ok) throw new ApiError(response.status, path);
  // 204: işlem yapıldı, dönecek içerik yok.
  const text = await response.text();
  return { ok: true, value: (text ? JSON.parse(text) : true) as T };
}

/** İçerik dönmeyen işlem; 404'te false. */
export async function remove(path: string): Promise<boolean> {
  const response = await request("DELETE", path);
  if (response.status === 404) return false;
  if (!response.ok) throw new ApiError(response.status, path);
  return true;
}
