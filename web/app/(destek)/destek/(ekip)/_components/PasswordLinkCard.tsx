"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import type { PasswordLink } from "@/lib/api/types";
import { whatsappHref } from "@/lib/format";
import styles from "./onboarding.module.css";

interface PasswordLinkCardProps {
  link: PasswordLink;
  shopName: string;
  /** WhatsApp'ın açılacağı numara; yoksa kişi WhatsApp'ta seçilir. */
  phone?: string;
  title: string;
}

/** Şifre bağlantısı yalnızca bir kez gösterilir; destek ekibi kopyalar ya da WhatsApp'tan gönderir. */
export function PasswordLinkCard({ link, shopName, phone, title }: PasswordLinkCardProps) {
  const [copied, setCopied] = useState(false);
  const message = `Merhaba ${link.ownerName}, ${shopName} Tomurcuk'ta açıldı. Panele giriş şifrenizi belirlemek için: ${link.url} Bağlantı 7 gün geçerli ve bir kez kullanılır. E-postanız: ${link.ownerEmail}`;
  const whatsapp = `${phone ? whatsappHref(phone) : "https://wa.me/"}?text=${encodeURIComponent(message)}`;
  return (
    <div className={styles.card} role="status">
      <h2 className={styles.cardTitle}>{title}</h2>
      <p className={styles.cardText}>
        Bağlantı {link.ownerName} adına {link.ownerEmail} adresine e-postayla da gönderildi; WhatsApp&apos;tan da
        iletebilirsiniz. 7 gün geçerli, bir kez kullanılır ve bu sayfadan ayrılınca yeniden gösterilmez; gerekirse
        dükkânın özetinden yenisini oluşturursunuz.
      </p>
      <input className={`tm-field__control ${styles.url}`} readOnly value={link.url} aria-label="Şifre bağlantısı" onFocus={(e) => e.target.select()} />
      <div className={styles.actions}>
        <Button
          variant="secondary"
          onClick={async () => {
            await navigator.clipboard.writeText(link.url);
            setCopied(true);
          }}
        >
          {copied ? "Kopyalandı" : "Bağlantıyı kopyala"}
        </Button>
        <Button href={whatsapp} target="_blank" rel="noopener">
          WhatsApp&apos;tan gönder
        </Button>
      </div>
    </div>
  );
}
