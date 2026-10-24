"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { NewOrders } from "@/lib/api/types";
import { SOUND_EVENT, playChime, setSoundEnabled, soundEnabled, unlockSound } from "@/lib/panel/alert-sound";
import styles from "./panel.module.css";

const INTERVAL = 30_000;

/**
 * Panel açıkken 30 saniyede bir yeni siparişleri sorar. En son gelen sipariş değişince sayfayı
 * yeniler, süzülen bildirim gösterir, sekme arka plandaysa başlığa sayıyı yazar ve sesli uyarı
 * açıksa zil çalar. İlk yanıt yalnızca başlangıç noktasıdır; uyarı vermez.
 */
export function NewOrderWatcher() {
  const router = useRouter();
  const latest = useRef<string | null | undefined>(undefined);
  const [notice, setNotice] = useState<{ id: string; text: string } | null>(null);

  useEffect(() => {
    const unlock = () => {
      if (soundEnabled()) unlockSound();
    };
    const onPref = (event: Event) => {
      if ((event as CustomEvent<boolean>).detail) unlockSound();
    };
    window.addEventListener("pointerdown", unlock);
    window.addEventListener("keydown", unlock);
    window.addEventListener(SOUND_EVENT, onPref);
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
      window.removeEventListener(SOUND_EVENT, onPref);
    };
  }, []);

  useEffect(() => {
    let title: string | null = null;
    const restoreTitle = () => {
      if (!document.hidden && title !== null) {
        document.title = title;
        title = null;
      }
    };

    async function check() {
      let orders: NewOrders;
      try {
        const response = await fetch("/panel/yeni-siparisler", { cache: "no-store" });
        if (!response.ok || !response.headers.get("content-type")?.includes("json")) return;
        orders = (await response.json()) as NewOrders;
      } catch {
        return;
      }
      const previous = latest.current;
      latest.current = orders.latestOrderId;
      if (previous === undefined || !orders.latestOrderId || orders.latestOrderId === previous) return;
      setNotice({ id: orders.latestOrderId, text: `Yeni sipariş: ${orders.latestNumber}` });
      if (document.hidden) {
        title ??= document.title;
        document.title = `(${orders.count}) Yeni sipariş · Tomurcuk`;
      }
      if (soundEnabled()) playChime();
      router.refresh();
    }

    void check();
    const timer = setInterval(check, INTERVAL);
    document.addEventListener("visibilitychange", restoreTitle);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", restoreTitle);
      restoreTitle();
    };
  }, [router]);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 12_000);
    return () => clearTimeout(timer);
  }, [notice]);

  return (
    <div role="status" className={styles.alertRegion}>
      {notice && (
        <div key={notice.id} className={styles.alert}>
          <span>{notice.text}</span>
          <Link href={`/panel/siparisler/${notice.id}`} className={styles.alertLink} onClick={() => setNotice(null)}>
            Gör
          </Link>
        </div>
      )}
    </div>
  );
}

function subscribe(onChange: () => void) {
  window.addEventListener(SOUND_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(SOUND_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

/** "Bugün" ekranında: sesli uyarıyı açıp kapatır. Açılırken bir kez çalar, sesin geldiği duyulsun. */
export function SoundToggle() {
  // Tercih tarayıcıda; sunucuda bilinmez, satır ilk çizimden sonra görünür.
  const on = useSyncExternalStore(subscribe, soundEnabled, () => null);
  if (on === null) return null;
  return (
    <p className={styles.soundRow}>
      {on ? "Yeni sipariş gelince bu sekmede zil çalar." : "Yeni sipariş gelince zil çalsın mı?"}
      <button
        type="button"
        className={styles.soundButton}
        onClick={() => {
          setSoundEnabled(!on);
          if (!on) {
            unlockSound();
            playChime();
          }
        }}
      >
        {on ? "Sesli uyarıyı kapat" : "Sesli uyarıyı aç"}
      </button>
    </p>
  );
}
