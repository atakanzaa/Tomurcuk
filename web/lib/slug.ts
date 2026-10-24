// Dükkân adından adres önerisi: "Nergis Çiçek Atölyesi" → "nergis-cicek-atolyesi". API ayrıca
// doğrular (biçim, ayrılmış kelimeler, başka dükkânda olmaması).
const LETTERS: Record<string, string> = { ç: "c", ğ: "g", ı: "i", i̇: "i", ö: "o", ş: "s", ü: "u", â: "a", î: "i", û: "u" };

export function suggestSlug(name: string): string {
  return name
    .toLocaleLowerCase("tr-TR")
    .replace(/[çğıöşüâîû]|i̇/g, (ch) => LETTERS[ch] ?? ch)
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)
    .replace(/-+$/, "");
}
