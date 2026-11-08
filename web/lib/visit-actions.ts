"use server";

import { findShop, recordVisit } from "@/lib/api";
import { ShopLookupKind } from "@/lib/api/types";
import { isChannel } from "@/lib/channel";

/**
 * Vitrinin ziyaret bildirimi (VisitTracker). Yalnızca dükkân ve kanal gider; sayım
 * başarısız olursa alıcı bir şey görmez.
 */
export async function recordVisitAction(slug: string, channel: string): Promise<void> {
  if (!isChannel(channel)) return;
  try {
    const lookup = await findShop(slug);
    if (lookup.kind !== ShopLookupKind.Found) return;
    await recordVisit(lookup.shop.id, channel);
  } catch (error) {
    console.warn("Ziyaret sayılamadı", slug, error);
  }
}
