"use client";

import { useSyncExternalStore } from "react";
import { Button } from "@/components/ui/Button";
import { THEME_STORAGE_KEY, Theme } from "@/lib/theme";

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => observer.disconnect();
}

const getTheme = (): Theme => (document.documentElement.dataset.theme === Theme.Dark ? Theme.Dark : Theme.Light);

/** Açık ve koyu tema arasında geçiş; seçim bu tarayıcıda saklanır. */
export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getTheme, () => Theme.Light);
  const next = theme === Theme.Dark ? Theme.Light : Theme.Dark;

  return (
    <Button
      variant="secondary"
      size="s"
      onClick={() => {
        document.documentElement.dataset.theme = next;
        try {
          localStorage.setItem(THEME_STORAGE_KEY, next);
        } catch {
          // Gizli pencerede depolama kapalı olabilir; tema yalnızca bu sayfada değişir.
        }
      }}
    >
      {next === Theme.Dark ? "Koyu temaya geç" : "Açık temaya geç"}
    </Button>
  );
}
