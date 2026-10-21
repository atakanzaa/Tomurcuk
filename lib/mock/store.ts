import type { Order, OrderDraft } from "@/lib/api/types";
import { orders as seedOrders } from "./data";

/** Bellekteki taslak; backend'de order_draft tablosuna karşılık gelir. */
export interface StoredDraft extends OrderDraft {
  expiresAt: number;
}

interface MockState {
  drafts: Map<string, StoredDraft>;
  orders: Order[];
  /** idempotency anahtarı → takip token'ı */
  idempotency: Map<string, string>;
  /** "tarih|aralık" → mock'ta verilen sipariş sayısı (örnek kapasitenin üstüne). */
  slotUsage: Map<string, number>;
  nextNumber: number;
}

// Geliştirmede modüller yeniden yüklendiğinde veri kaybolmasın diye globalThis'te tutulur.
// Tek süreçli çalışır; backend gelince bu dosya tamamen kalkar.
const globalForMock = globalThis as typeof globalThis & { __tomurcukMock?: MockState };

export const store: MockState = (globalForMock.__tomurcukMock ??= {
  drafts: new Map(),
  orders: structuredClone(seedOrders),
  idempotency: new Map(),
  slotUsage: new Map(),
  nextNumber: 4824,
});

/** Tahmin edilemez, URL'de güvenle taşınabilen anahtar. */
export function randomToken(length = 16): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
}
