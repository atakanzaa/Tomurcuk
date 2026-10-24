"use server";

import { refresh, updateTag } from "next/cache";
import {
  addClosedDay,
  removeClosedDay,
  saveDeliveryZones,
  saveSameDayCutoff,
  saveShopProfile,
  saveTimeSlots,
} from "@/lib/api";
import type { FieldErrors, SlotSetting, ZoneSetting } from "@/lib/api/types";
import { formatDayMonth } from "@/lib/dates";
import { formValues, type FormState } from "@/lib/checkout/form-state";
import { settingsErrorMessages } from "./settings";
import type { ActionNotice } from "./notice";
import { loadPanel } from "./session";

/** Ayar formlarının durumu: alan hataları, gönderilen değerler ve kısa bildirim. */
export interface SettingsFormState extends FormState {
  notice: ActionNotice;
}

const str = (formData: FormData, key: string) => {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
};

/** Vitrin, ürün sayfası, sözleşmeler, sipariş adımları ve alıcı ana sayfası yeniden okunur. */
function refreshShowcase(shop: { id: string; slug: string }) {
  updateTag(`shop:${shop.id}`);
  updateTag(`shop-slug:${shop.slug}`);
  updateTag("discover");
}

const done = (prev: SettingsFormState, message: string, values: Record<string, string> = {}): SettingsFormState => ({
  version: prev.version + 1,
  errors: {},
  values,
  notice: { version: prev.notice.version + 1, message, error: false },
});

const failed = (prev: SettingsFormState, errors: FieldErrors, values: Record<string, string> = {}): SettingsFormState => ({
  version: prev.version + 1,
  errors: settingsErrorMessages(errors),
  values,
  notice: prev.notice,
});

function parseJson<T>(formData: FormData): T | null {
  try {
    return JSON.parse(str(formData, "payload")) as T;
  } catch {
    return null;
  }
}

export async function saveProfileForm(prev: SettingsFormState, formData: FormData): Promise<SettingsFormState> {
  const { shop } = await loadPanel();
  const values = formValues(formData);
  const result = await saveShopProfile(shop.id, {
    name: str(formData, "name"),
    shortName: str(formData, "shortName"),
    phone: str(formData, "phone"),
    address: str(formData, "address"),
    descriptionShort: str(formData, "descriptionShort"),
    description: str(formData, "description"),
    openingHours: str(formData, "openingHours"),
    featuredProductId: str(formData, "featuredProductId"),
    legalName: str(formData, "legalName"),
    taxOffice: str(formData, "taxOffice"),
    taxNumber: str(formData, "taxNumber"),
    email: str(formData, "email"),
    notifyPhone: str(formData, "notifyPhone"),
    notifySms: str(formData, "notifySms") === "on",
  });
  if (!result.ok) return failed(prev, result.errors, values);
  refreshShowcase(shop);
  refresh();
  return done(prev, "Dükkân bilgileri kaydedildi. Vitrininizde ve sözleşmelerde görünüyor.");
}

export async function saveCutoffForm(prev: SettingsFormState, formData: FormData): Promise<SettingsFormState> {
  const { shop } = await loadPanel();
  const cutoff = str(formData, "sameDayCutoff");
  const result = await saveSameDayCutoff(shop.id, cutoff);
  if (!result.ok) return failed(prev, result.errors, formValues(formData));
  refreshShowcase(shop);
  refresh();
  return done(prev, `Aynı gün teslim için son sipariş saati ${cutoff} oldu.`);
}

export async function saveSlotsForm(prev: SettingsFormState, formData: FormData): Promise<SettingsFormState> {
  const { shop } = await loadPanel();
  const slots = parseJson<SlotSetting[]>(formData);
  if (!slots) return { ...prev, version: prev.version + 1, errors: { slots: "Form okunamadı. Sayfayı yenileyin." } };
  const result = await saveTimeSlots(shop.id, slots);
  if (!result.ok) return failed(prev, result.errors);
  refreshShowcase(shop);
  refresh();
  return done(prev, "Saat aralıkları kaydedildi.");
}

export async function saveZonesForm(prev: SettingsFormState, formData: FormData): Promise<SettingsFormState> {
  const { shop } = await loadPanel();
  const zones = parseJson<ZoneSetting[]>(formData);
  if (!zones) return { ...prev, version: prev.version + 1, errors: { zones: "Form okunamadı. Sayfayı yenileyin." } };
  const result = await saveDeliveryZones(shop.id, zones);
  if (!result.ok) return failed(prev, result.errors);
  refreshShowcase(shop);
  refresh();
  return done(prev, "Teslim bölgeleri kaydedildi.");
}

export async function addClosedDayForm(prev: SettingsFormState, formData: FormData): Promise<SettingsFormState> {
  const { shop } = await loadPanel();
  const result = await addClosedDay(shop.id, str(formData, "date"));
  if (!result.ok) return failed(prev, result.errors, formValues(formData));
  refreshShowcase(shop);
  refresh();
  const { date, reserved } = result.value;
  return done(
    prev,
    reserved
      ? `${formatDayMonth(date)} kapalı. O güne alınmış ${reserved} sipariş var; onları Siparişler'de görebilirsiniz.`
      : `${formatDayMonth(date)} kapalı; o güne sipariş alınmaz.`,
  );
}

export async function removeClosedDayAction(formData: FormData) {
  const { shop } = await loadPanel();
  await removeClosedDay(shop.id, str(formData, "date"));
  refreshShowcase(shop);
  refresh();
}
