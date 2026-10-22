import "server-only";
import { cookies } from "next/headers";

// Tarayıcıda yalnızca taslağın kimliği durur; adres ve telefon backend'deki taslaktadır.
const COOKIE = "tomurcuk_taslak";

const options = (slug: string) => ({
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: `/${slug}`,
  maxAge: 2 * 60 * 60,
});

export async function readDraftId(): Promise<string | null> {
  return (await cookies()).get(COOKIE)?.value ?? null;
}

export async function writeDraftId(slug: string, draftId: string) {
  (await cookies()).set(COOKIE, draftId, options(slug));
}

export async function clearDraftId(slug: string) {
  (await cookies()).set(COOKIE, "", { ...options(slug), maxAge: 0 });
}
