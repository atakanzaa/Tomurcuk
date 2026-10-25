import Link from "next/link";
import { ShopStatus, type Shop } from "@/lib/api/types";
import { formatReopening } from "@/lib/shop-status";
import styles from "./panel.module.css";

/** Destek ekibi siparişleri kapattıysa ya da dükkânı askıya aldıysa her sayfanın üstünde. */
export function StatusBand({ shop, reason }: { shop: Shop; reason: string }) {
  if (shop.status !== ShopStatus.Paused && shop.status !== ShopStatus.Suspended) return null;
  const why = reason ? ` Gerekçe: ${reason}` : "";
  return (
    <div className={styles.statusBand} data-tone={shop.status} role="status">
      {shop.status === ShopStatus.Paused ? (
        <span>
          <strong>Vitrininiz geçici olarak sipariş almıyor.</strong>
          {why}
          {shop.pausedUntil ? ` ${formatReopening(shop.pausedUntil, shop.timeZone)} itibarıyla kendiliğinden açılır.` : ""} Var
          olan siparişleriniz burada.
        </span>
      ) : (
        <span>
          <strong>Dükkânınız askıya alındı; vitrin sipariş almıyor.</strong>
          {why} Var olan siparişleriniz burada. Konuşmak için <Link href="/panel/yardim">destek talebi açın</Link>.
        </span>
      )}
    </div>
  );
}
