import type { Impersonation } from "@/lib/api/types";
import { withTimeSuffix, zonedNow } from "@/lib/format";
import { finishImpersonation } from "@/lib/panel/actions";
import styles from "./panel.module.css";

/** Destek ekibi dükkân adına girdiğinde her sayfanın üstünde görünür. */
export function ImpersonationBand({ impersonation, shopName, timeZone }: { impersonation: Impersonation; shopName: string; timeZone: string }) {
  const until = zonedNow(new Date(impersonation.endsAt), timeZone).time;
  return (
    <div className={styles.impersonation} role="status">
      <span>
        <strong>Destek oturumu.</strong> {impersonation.supportUserName}, {shopName} adına bakıyor; oturum {withTimeSuffix(until, "dative")} kadar.
        Her işlem kayda geçer.
      </span>
      <form action={finishImpersonation}>
        <button type="submit" className={styles.impersonationEnd}>
          Oturumu bitir
        </button>
      </form>
    </div>
  );
}
