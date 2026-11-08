"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

/** Bağlantıyı panoya kopyalar; sonucu butonun yazısı söyler. */
export function CopyButton({ text, label }: { text: string; label: string }) {
  const [state, setState] = useState<"idle" | "done" | "failed">("idle");
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setState("done");
    } catch {
      setState("failed");
    }
    window.setTimeout(() => setState("idle"), 2000);
  };
  return (
    <Button variant="secondary" size="s" onClick={copy} aria-label={`${label} bağlantısını kopyala`}>
      <span aria-live="polite">{state === "done" ? "Kopyalandı" : state === "failed" ? "Kopyalanamadı" : "Kopyala"}</span>
    </Button>
  );
}
