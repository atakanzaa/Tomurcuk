import "server-only";
import { redirect } from "next/navigation";
import { API_SESSION_COOKIE, readPanelSession } from "@/lib/panel/cookie";
import { LOGIN_PATH } from "@/lib/routes";
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
 * Panel uçları (`/api/panel/...`) tarayıcının panel oturumunu API'ye iletir. Oturum yoksa ya da
 * süresi dolduysa (401) kullanıcı giriş sayfasına gider.
 */
async function request(method: string, path: string, body?: unknown): Promise<Response> {
  const panel = path.startsWith("/api/panel/");
  const session = panel ? await readPanelSession() : null;
  if (panel && !session) redirect(LOGIN_PATH);
  const response = await fetch(apiUrl(path), {
    method,
    headers: {
      Accept: "application/json",
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      ...(session ? { Cookie: `${API_SESSION_COOKIE}=${session}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (panel && response.status === 401) redirect(LOGIN_PATH);
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
  const response = await request(method, path, body);
  if (response.status === 422) {
    const { errors } = (await response.json()) as { errors: FieldErrors<F> };
    return { ok: false, errors };
  }
  if (!response.ok) throw new ApiError(response.status, path);
  return { ok: true, value: (await response.json()) as T };
}
