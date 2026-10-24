import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { LoginShell } from "@/components/auth/LoginShell";
import styles from "@/components/auth/login.module.css";
import { Button } from "@/components/ui/Button";
import { getPasswordHolder } from "@/lib/api";
import { LOGIN_PATH } from "@/lib/routes";
import { SetPasswordForm } from "./SetPasswordForm";

export const metadata: Metadata = { title: "Şifrenizi belirleyin · Tomurcuk", robots: { index: false, follow: false } };

/** Destek ekibinin gönderdiği tek kullanımlık bağlantı; 7 gün geçerli. */
export default function SetPasswordPage({ params }: PageProps<"/sifre/[token]">) {
  return (
    <LoginShell aside="Siparişleriniz, müşteri defteriniz ve vitrininiz sizi bekliyor.">
      <Suspense>
        <SetPassword params={params} />
      </Suspense>
    </LoginShell>
  );
}

async function SetPassword({ params }: Pick<PageProps<"/sifre/[token]">, "params">) {
  await connection();
  const { token } = await params;
  const holder = await getPasswordHolder(token);
  if (!holder) {
    return (
      <>
        <h1 className={styles.title}>Bu bağlantı artık geçerli değil</h1>
        <p className={styles.lede}>
          Bu bağlantı kullanılmış ya da 7 günlük süresi dolmuş. Tomurcuk ekibinden yeni bağlantı isteyin. Şifrenizi daha önce
          belirlediyseniz giriş yapabilirsiniz.
        </p>
        <Button href={LOGIN_PATH} variant="secondary">
          Giriş sayfasına git
        </Button>
      </>
    );
  }
  return (
    <>
      <h1 className={styles.title}>Şifrenizi belirleyin</h1>
      <p className={styles.lede}>
        {holder.name}, {holder.shopName} paneline {holder.email} adresi ve burada belirlediğiniz şifreyle girersiniz.
      </p>
      <SetPasswordForm token={token} email={holder.email} />
    </>
  );
}
