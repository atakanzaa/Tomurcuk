import "server-only";
import { redirect } from "next/navigation";
import { getPanelSession } from "@/lib/api";
import { readImpersonation, readSession } from "@/lib/auth/cookie";
import { LOGIN_PATH } from "@/lib/routes";

/**
 * Paneldeki oturum: dükkân, kullanıcı ve varsa dükkân adına açılmış destek oturumu.
 * Giriş yapılmamışsa ya da oturumun süresi dolduysa giriş sayfasına gider.
 */
export async function loadPanel() {
  const impersonating = (await readImpersonation()) && (await readSession("support"));
  if (!impersonating && !(await readSession("panel"))) redirect(LOGIN_PATH);
  return getPanelSession(null);
}
