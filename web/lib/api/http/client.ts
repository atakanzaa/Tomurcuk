import "server-only";

// API iç ağdadır; tarayıcı onu hiç görmez. Yalnızca Server Component'ler, Server Action'lar
// ve proxy buradan çağırır.
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

async function request(path: string): Promise<Response> {
  return fetch(`${API_URL}${path}`, { headers: { Accept: "application/json" } });
}

export async function get<T>(path: string): Promise<T> {
  const response = await request(path);
  if (!response.ok) throw new ApiError(response.status, path);
  return (await response.json()) as T;
}

/** Kayıt yoksa (404) null; başka dükkânın kaydı da 404 döner. */
export async function getOrNull<T>(path: string): Promise<T | null> {
  const response = await request(path);
  if (response.status === 404) return null;
  if (!response.ok) throw new ApiError(response.status, path);
  return (await response.json()) as T;
}
