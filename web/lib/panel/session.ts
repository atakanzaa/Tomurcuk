import "server-only";
import { redirect } from "next/navigation";
import { getPanelSession } from "@/lib/api";
import { LOGIN_PATH } from "@/lib/routes";
import { readPanelSession } from "./cookie";

/** Destek ekibinin dükkân adına açtığı oturumun kimliği; destek panelinden yazılır. */
export const IMPERSONATION_COOKIE = "tomurcuk_destek_oturumu";

/**
 * Paneldeki oturum: dükkân, kullanıcı ve varsa dükkân adına açılmış destek oturumu.
 * Giriş yapılmamışsa ya da oturumun süresi dolduysa giriş sayfasına gider.
 */
export async function loadPanel() {
  if (!(await readPanelSession())) redirect(LOGIN_PATH);
  return getPanelSession(null);
}
