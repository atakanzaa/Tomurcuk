"use client";

import { Export } from "@phosphor-icons/react";
import { useState } from "react";
import styles from "./product.module.css";

/** Ürün linkini paylaşır; paylaşım menüsü olmayan tarayıcıda linki kopyalar. */
export function ShareButton({ title }: { title: string }) {
  const [status, setStatus] = useState("");

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setStatus("Link kopyalandı.");
    } catch (error) {
      // Kullanıcı paylaşımı kapattıysa bir şey söylemeye gerek yok.
      if (error instanceof DOMException && error.name === "AbortError") return;
      setStatus("Link kopyalanamadı. Adres çubuğundan kopyalayabilirsiniz.");
    }
  };

  return (
    <>
      <button type="button" className={styles.share} aria-label="Paylaş" onClick={share}>
        <Export size={20} aria-hidden="true" />
      </button>
      <span className={styles.toast} role="status" data-visible={Boolean(status)}>
        {status}
      </span>
    </>
  );
}
