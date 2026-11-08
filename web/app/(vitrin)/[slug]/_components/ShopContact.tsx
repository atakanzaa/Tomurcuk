import { Phone } from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/Button";
import type { DeliveryZone, Shop } from "@/lib/api/types";
import { cx } from "@/lib/cx";
import { formatPrice, phoneHref, whatsappHref, withTimeSuffix } from "@/lib/format";
import container from "./container.module.css";
import styles from "./ShopContact.module.css";

/** Google Haritalar'da adres araması; anahtar gerektirmez. */
function mapHref(address: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

function zoneName(zone: DeliveryZone): string {
  return zone.neighborhood ? `${zone.district}: ${zone.neighborhood}` : zone.district;
}

/** Vitrinin altında: arama, WhatsApp ve Instagram; atölyenin adresi, çalışma saatleri ve teslim edilen semtler. */
export function ShopContact({ shop, zones }: { shop: Shop; zones: DeliveryZone[] }) {
  const whatsapp = shop.whatsapp || shop.phone;
  return (
    <section id="iletisim" aria-labelledby="ulasin" className={cx(container.container, styles.contact)}>
      <div className={styles.head}>
        <div className={styles.headText}>
          <h2 id="ulasin" className={styles.heading}>
            Bize ulaşın
          </h2>
          <p className={styles.lede}>Siparişinizle ilgili sorunuz varsa arayın ya da WhatsApp&apos;tan yazın.</p>
        </div>
        <div className={styles.buttons}>
          <Button href={phoneHref(shop.phone)}>
            <Phone size={20} aria-hidden="true" />
            {shop.phone}
          </Button>
          <Button variant="secondary" href={whatsappHref(whatsapp)}>
            WhatsApp&apos;tan yazın
          </Button>
          {shop.instagram && (
            <Button variant="secondary" href={`https://instagram.com/${encodeURIComponent(shop.instagram)}`}>
              Instagram: @{shop.instagram}
            </Button>
          )}
        </div>
      </div>
      <div className={styles.columns}>
        <div className={styles.column}>
          <h3 className={styles.title}>Atölye</h3>
          <address className={styles.address}>{shop.address}</address>
          <a href={mapHref(shop.address)} className={styles.link} target="_blank" rel="noopener noreferrer">
            Haritada açın
          </a>
        </div>
        <div className={styles.column}>
          <h3 className={styles.title}>Çalışma saatleri</h3>
          {shop.openingHours && <p className={styles.text}>{shop.openingHours}</p>}
          <p className={styles.muted}>
            Aynı gün teslim için son sipariş {withTimeSuffix(shop.sameDayCutoff, "dative")} kadar.
          </p>
        </div>
        {zones.length > 0 && (
          <div className={styles.column}>
            <h3 className={styles.title}>Teslim ettiğimiz semtler</h3>
            <ul className={styles.zones}>
              {zones.map((zone) => (
                <li key={zone.id} className={styles.zone}>
                  <span>{zoneName(zone)}</span>
                  <span className={styles.fee}>{zone.fee === 0 ? "Ücretsiz" : formatPrice(zone.fee)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
