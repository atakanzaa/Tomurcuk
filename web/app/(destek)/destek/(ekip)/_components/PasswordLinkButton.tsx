"use client";

import { useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import type { PasswordLink } from "@/lib/api/types";
import { newPasswordLinkAction } from "@/lib/onboarding-actions";
import dialog from "./dialog.module.css";
import { PasswordLinkCard } from "./PasswordLinkCard";

/** Dükkân özetinde: sahibe yeni şifre bağlantısı. Eskisi geçersiz olur; işlem denetim kaydına yazılır. */
export function PasswordLinkButton({ shopId, shopName, phone }: { shopId: string; shopName: string; phone: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [link, setLink] = useState<PasswordLink | null>(null);
  const [failed, setFailed] = useState(false);
  const [pending, start] = useTransition();
  return (
    <>
      <Button variant="secondary" onClick={() => ref.current?.showModal()}>
        Şifre bağlantısı
      </Button>
      <dialog ref={ref} className={dialog.dialog} aria-labelledby="sifre-baslik">
        <div className={dialog.dialogForm}>
          {link ? (
            <PasswordLinkCard link={link} shopName={shopName} phone={phone} title="Yeni şifre bağlantısı" />
          ) : (
            <>
              <h2 id="sifre-baslik" className={dialog.dialogTitle}>
                Şifre bağlantısı oluştur
              </h2>
              <p className={dialog.dialogText}>
                Dükkân sahibi şifresini unuttuysa ya da ilk bağlantının süresi geçtiyse yeni bağlantı oluşturun. Önceki bağlantılar
                geçersiz olur; işlem denetim kaydına yazılır.
              </p>
              {failed && <p className={dialog.dialogText}>Bu dükkânın sahibi bulunamadı.</p>}
            </>
          )}
          <div className={dialog.dialogActions}>
            <Button variant="secondary" onClick={() => ref.current?.close()}>
              Kapat
            </Button>
            {!link && (
              <Button
                disabled={pending}
                onClick={() =>
                  start(async () => {
                    const created = await newPasswordLinkAction(shopId);
                    setLink(created);
                    setFailed(!created);
                  })
                }
              >
                Bağlantı oluştur
              </Button>
            )}
          </div>
        </div>
      </dialog>
    </>
  );
}
