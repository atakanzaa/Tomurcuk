/**
 * Server Action ile gönderilen formların durumu. Hatada gönderilen değerler geri döner;
 * form `key={version}` ile yeniden kurulur ve alanlar bu değerlerle dolar.
 */
export interface FormState {
  version: number;
  errors: Record<string, string>;
  values: Record<string, string>;
}

export const initialFormState: FormState = { version: 0, errors: {}, values: {} };

export function formValues(formData: FormData): Record<string, string> {
  return Object.fromEntries([...formData.entries()].flatMap(([k, v]) => (typeof v === "string" && !k.startsWith("$") ? [[k, v]] : [])));
}
