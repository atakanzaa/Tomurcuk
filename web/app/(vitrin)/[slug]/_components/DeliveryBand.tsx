import { Clock } from "@phosphor-icons/react/dist/ssr";
import { connection } from "next/server";
import { KraftBand } from "@/components/ui/KraftBand";
import type { Shop } from "@/lib/api/types";
import { withTimeSuffix, zonedNow } from "@/lib/format";
import styles from "./Hero.module.css";

const clock = <Clock size={20} className={styles.bandIcon} aria-hidden="true" />;

/** Aynı gün teslim bandı. `sameDayOpen` false ise son sipariş saati geçmiştir. */
export function DeliveryBand({ shop, sameDayOpen }: { shop: Shop; sameDayOpen: boolean }) {
  if (!shop.active) {
    return (
      <KraftBand className={styles.band}>
        <strong>Şu an sipariş almıyoruz.</strong> Bilgi için {shop.phone} numarasından bize ulaşın.
      </KraftBand>
    );
  }
  return (
    <KraftBand className={styles.band} action={clock}>
      {sameDayOpen ? (
        <>
          <strong>Bugün teslim</strong> için {withTimeSuffix(shop.sameDayCutoff, "dative")} kadar sipariş verin.
        </>
      ) : (
        <>
          <strong>Yarın teslim</strong> için sipariş verebilirsiniz. Bugünün siparişleri{" "}
          {withTimeSuffix(shop.sameDayCutoff, "locative")} kapandı.
        </>
      )}
    </KraftBand>
  );
}

/**
 * Son sipariş saatini istek anında, dükkânın saat dilimine göre hesaplar. Gerçek kontrol
 * sipariş verilirken sunucuda yapılır; bu bant yalnızca bilgi verir.
 */
export async function LiveDeliveryBand({ shop }: { shop: Shop }) {
  await connection();
  const now = zonedNow(new Date(), shop.timeZone);
  return <DeliveryBand shop={shop} sameDayOpen={now.time < shop.sameDayCutoff} />;
}
