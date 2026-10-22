"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/Button";

/** Gönderim sürerken devre dışı kalır; çift tıklama ikinci isteği göndermez. */
export function SubmitButton({ children }: { children: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" block disabled={pending} aria-busy={pending || undefined}>
      {children}
    </Button>
  );
}
