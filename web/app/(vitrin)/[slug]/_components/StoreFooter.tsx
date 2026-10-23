import { Button } from "@/components/ui/Button";
import { LogoMark } from "@/components/ui/Logo";
import type { DeliveryZone, Shop } from "@/lib/api/types";
import { cx } from "@/lib/cx";
import { formatPriceRange, phoneHref, whatsappHref } from "@/lib/format";
import container from "./container.module.css";
import styles from "./StoreFooter.module.css";

/** "Kadıköy, Üsküdar, Ataşehir. Teslimat 60–120 TL, ilçeye göre." */
function zonesSummary(zones: DeliveryZone[]): string {
  const districts = [...new Set(zones.map((zone) => zone.district))];
  const fees = zones.map((zone) => zone.fee);
  return `${districts.join(", ")}. Teslimat ${formatPriceRange(Math.min(...fees), Math.max(...fees))}, ilçeye göre.`;
}

export function StoreFooter({ shop, zones }: { shop: Shop; zones: DeliveryZone[] }) {
  return (
    <footer className={styles.footer}>
      <div className={cx(container.container, styles.columns)}>
        <div className={styles.block}>
          <h2 className={styles.name}>{shop.name}</h2>
          <address className={styles.address}>
            <span className={styles.muted}>{shop.address}</span>
            <span className={styles.muted}>{shop.openingHours}</span>
          </address>
        </div>
        {zones.length > 0 && (
          <div className={cx(styles.block, styles.zones)}>
            <h2 className={styles.title}>Teslim ettiğimiz yerler</h2>
            <p className={cx(styles.muted, styles.text)}>
              {zonesSummary(zones)}
            </p>
          </div>
        )}
        <div className={cx(styles.block, styles.contact)}>
          <h2 className={cx(styles.title, styles.contactTitle)}>Bize ulaşın</h2>
          <div className={styles.buttons}>
            <Button variant="secondary" size="s" href={phoneHref(shop.phone)}>
              Ara
            </Button>
            <Button variant="secondary" size="s" href={whatsappHref(shop.phone)}>
              WhatsApp&apos;tan yaz
            </Button>
          </div>
        </div>
      </div>
      <p className={cx(container.container, styles.credit)}>
        <LogoMark className={styles.creditMark} />
        Tomurcuk ile hazırlandı
      </p>
    </footer>
  );
}
