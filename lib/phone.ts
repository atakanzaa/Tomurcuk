// Türkiye numaraları: alan kodu ya da operatör koduyla 10 hane (başındaki 0 hariç).
// Gerçek doğrulama backend'de libphonenumber ile yapılır; bu yalnızca biçim içindir.

/** "+90 532 412 8819", "05324128819" → "5324128819"; geçersizse null. */
export function normalizePhone(input: string): string | null {
  const digits = input.replace(/\D/g, "").replace(/^90(?=\d{10}$)/, "").replace(/^0(?=\d{10}$)/, "");
  return /^[2-5]\d{9}$/.test(digits) ? digits : null;
}

/** "5324128819" → "0532 412 88 19" */
export function formatPhone(normalized: string): string {
  return `0${normalized.slice(0, 3)} ${normalized.slice(3, 6)} ${normalized.slice(6, 8)} ${normalized.slice(8)}`;
}
