import "server-only";
import { cookies } from "next/headers";
import { getPanelSession } from "@/lib/api";

/** Destek ekibinin dükkân adına açtığı oturumun kimliği; destek panelinden yazılır. */
export const IMPERSONATION_COOKIE = "tomurcuk_destek_oturumu";

/**
 * Paneldeki oturum. Gerçek uygulamada e-posta ve şifreyle giriş yapılır;
 * bu adımda giriş ekranı yok, mock dükkân sahibi (Ayla Er) oturumda sayılır.
 */
export async function loadPanel() {
  const impersonationId = (await cookies()).get(IMPERSONATION_COOKIE)?.value ?? null;
  return getPanelSession(impersonationId);
}
