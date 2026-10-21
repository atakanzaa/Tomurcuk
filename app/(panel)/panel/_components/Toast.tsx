"use client";

import { useEffect, useState } from "react";
import type { ActionNotice } from "@/lib/panel/notice";
import styles from "./order.module.css";

/**
 * İşlem sonucunu kısa süre gösteren süzülen bildirim. Canlı bölge (role=status) hep
 * yerinde durur; her yeni bildirimde içerik yeniden kurulur ve 4 saniye sonra kaybolur.
 */
export function Toast({ notice }: { notice: ActionNotice }) {
  return (
    <div role="status" className={styles.toastRegion}>
      {notice.version > 0 && <ToastMessage key={notice.version} message={notice.message} error={notice.error} />}
    </div>
  );
}

function ToastMessage({ message, error }: { message: string; error: boolean }) {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 4000);
    return () => clearTimeout(timer);
  }, []);
  if (!visible) return null;
  return (
    <span className={styles.toast} data-error={error}>
      {message}
    </span>
  );
}
