export const Theme = {
  Light: "light",
  Dark: "dark",
} as const;
export type Theme = (typeof Theme)[keyof typeof Theme];

export const THEME_STORAGE_KEY = "tomurcuk-theme";

/**
 * İlk boyamadan önce <html data-theme> değerini koyan betik. Kayıtlı seçim yoksa
 * işletim sisteminin tercihi kullanılır; böylece sayfa yanlış temayla yanıp sönmez.
 */
export const themeInitScript = `(function(){try{var t=localStorage.getItem("${THEME_STORAGE_KEY}");if(t!=="${Theme.Light}"&&t!=="${Theme.Dark}"){t=matchMedia("(prefers-color-scheme: dark)").matches?"${Theme.Dark}":"${Theme.Light}"}document.documentElement.dataset.theme=t}catch(e){}})()`;
