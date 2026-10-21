/** Tek düğmeli işlemlerin sonucu: kısa bildirim metni. */
export interface ActionNotice {
  version: number;
  message: string;
  error: boolean;
}

export const initialNotice: ActionNotice = { version: 0, message: "", error: false };
