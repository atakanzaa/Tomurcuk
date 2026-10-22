"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";

/** Sayfa açılınca yazdırma penceresini açar; tekrar için buton da durur. */
export function PrintOnLoad() {
  useEffect(() => {
    const timer = setTimeout(() => window.print(), 300);
    return () => clearTimeout(timer);
  }, []);
  return (
    <Button variant="secondary" onClick={() => window.print()}>
      Yazdır
    </Button>
  );
}
