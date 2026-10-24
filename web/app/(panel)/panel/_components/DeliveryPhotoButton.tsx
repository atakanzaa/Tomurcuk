"use client";

import { Camera } from "@phosphor-icons/react";
import { useRef, useState, type ChangeEvent } from "react";
import { Button } from "@/components/ui/Button";
import { addDeliveryPhoto } from "@/lib/panel/actions";
import { initialNotice } from "@/lib/panel/notice";
import { toDeliveryJpeg } from "@/lib/panel/photo";
import { Toast } from "./Toast";

/** Telefonda kamerayı açar; seçilen fotoğraf küçültülüp hemen yüklenir. */
export function DeliveryPhotoButton({ orderId, hasPhoto }: { orderId: string; hasPhoto: boolean }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(initialNotice);

  async function choose(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setBusy(true);
    let result: { message: string; error: boolean };
    try {
      const body = new FormData();
      body.set("orderId", orderId);
      body.set("file", await toDeliveryJpeg(file), "teslim.jpg");
      result = await addDeliveryPhoto(body);
    } catch {
      result = { message: "Fotoğraf yüklenemedi. Bağlantınızı kontrol edip yeniden deneyin.", error: true };
    }
    setBusy(false);
    setNotice((prev) => ({ version: prev.version + 1, ...result }));
  }

  return (
    <>
      <Button variant="secondary" disabled={busy} onClick={() => inputRef.current?.click()}>
        <Camera size={20} aria-hidden="true" />
        {busy ? "Yükleniyor" : hasPhoto ? "Fotoğrafı değiştir" : "Teslim fotoğrafı ekle"}
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
        capture="environment"
        hidden
        onChange={choose}
      />
      <Toast notice={notice} />
    </>
  );
}
