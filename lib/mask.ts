// Destek ekibi kişisel veriyi maskeli görür; açmak gerekçe ister ve denetim kaydına yazılır.

/** "0532 412 88 19" → "0532 *** ** 19" */
export function maskPhone(phone: string): string {
  const parts = phone.split(" ");
  if (parts.length !== 4) return phone.replace(/\d(?=\d{2})/g, "*");
  return `${parts[0]} *** ** ${parts[3]}`;
}

/** "Elif Yılmaz" → "Elif Y." */
export function shortName(name: string): string {
  const [first, ...rest] = name.trim().split(/\s+/);
  const last = rest.at(-1);
  return last ? `${first} ${last.charAt(0)}.` : first;
}
