/** Koşullu sınıf adlarını birleştirir: cx("a", false && "b", "c") → "a c" */
export function cx(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}
