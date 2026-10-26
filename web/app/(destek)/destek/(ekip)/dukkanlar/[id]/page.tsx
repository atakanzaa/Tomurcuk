import { CaretLeft } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { StatusTag } from "@/components/ui/StatusTag";
import { getShopOverview, getSupportUser } from "@/lib/api";
import { Permission, supportCan } from "@/lib/permissions";
import { ShopRole, ShopStatus, TicketPriority } from "@/lib/api/types";
import { cx } from "@/lib/cx";
import { formatDayMonth, relativeDayName } from "@/lib/dates";
import { formatPrice, formatShortTimeRange, withAblativeSuffix, zonedNow } from "@/lib/format";
import { shortName } from "@/lib/mask";
import { orderStatusLabel, orderStatusTone } from "@/lib/order";
import { planLabel } from "@/lib/shop";
import { formatReopening, shopStatusLabel } from "@/lib/shop-status";
import { durationText, minutesSince } from "@/lib/support";
import support from "../../_components/support.module.css";
import { PasswordLinkButton } from "../../_components/PasswordLinkButton";
import { ReviewModeration } from "./ReviewModeration";
import { ShopDialogs } from "./ShopDialogs";
import { ShopStatusControls } from "./ShopStatusControls";
import styles from "./overview.module.css";

export const metadata: Metadata = { title: "Dükkân özeti" };

const TZ = "Europe/Istanbul";
const MONTHS = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];

export default function ShopOverviewPage({ params }: PageProps<"/destek/dukkanlar/[id]">) {
  return (
    <Suspense>
      <Overview params={params} />
    </Suspense>
  );
}

async function Overview({ params }: Pick<PageProps<"/destek/dukkanlar/[id]">, "params">) {
  const { id } = await params;
  const [shop, user] = await Promise.all([getShopOverview(id), getSupportUser()]);
  if (!shop) notFound();
  const canOnboard = supportCan(user.role, Permission.ShopOnboard);
  const today = zonedNow(new Date(), TZ).date;
  const dayText = (iso: string) => {
    const when = zonedNow(new Date(iso), TZ);
    const day = relativeDayName(when.date, today);
    return day === "Bugün" || day === "Dün" ? `${day} ${when.time}` : formatDayMonth(when.date);
  };
  const owner = shop.users.find((u) => u.role === ShopRole.Owner);
  const since = shop.since ? withAblativeSuffix(`${MONTHS[Number(shop.since.slice(5, 7)) - 1]} ${shop.since.slice(0, 4)}`) : null;

  return (
    <>
      <Link href="/destek/dukkanlar" className={support.back}>
        <CaretLeft size={16} aria-hidden="true" />
        Dükkânlar
      </Link>
      <div className={styles.head}>
        <div className={styles.headText}>
          <h1 className={styles.title}>{shop.shop.name}</h1>
          <span className={support.muted}>
            {shop.district}, {planLabel[shop.shop.plan]}
            {since && `, ${since} beri`}
          </span>
        </div>
        <div className={styles.actions}>
          {canOnboard && <PasswordLinkButton shopId={shop.shop.id} shopName={shop.shop.name} phone={shop.shop.phone} />}
          <ShopDialogs
            shopId={shop.shop.id}
            shopShortName={shop.shop.shortName}
            ownerName={owner?.name ?? "dükkân sahibi"}
            reasons={[
              ...shop.tickets.map((t) => `Talep: ${t.subject}`),
              "Dükkân telefonda yardım istedi",
            ]}
          />
        </div>
      </div>

      <section className={styles.statusRow} aria-label="Dükkânın durumu">
        <p className={styles.statusText}>
          <strong className={shop.shop.active ? styles.active : styles.suspended}>{shopStatusLabel[shop.status.status]}</strong>
          {shop.status.status === ShopStatus.Paused && shop.status.pausedUntil && (
            <>, {formatReopening(shop.status.pausedUntil, TZ)} itibarıyla açılır</>
          )}
          {shop.status.reason && <>. {shop.status.reason}</>}
          {shop.status.changedBy && shop.status.changedAt && (
            <span className={support.muted}>
              {" "}
              ({shop.status.changedBy}, {dayText(shop.status.changedAt)})
            </span>
          )}
        </p>
        <ShopStatusControls
          shop={{ id: shop.shop.id, shortName: shop.shop.shortName, slugs: [shop.shop.slug, ...shop.shop.previousSlugs] }}
          status={shop.status}
          openOrders={shop.openOrders}
          canPause={supportCan(user.role, Permission.ShopPause)}
          canSuspend={supportCan(user.role, Permission.ShopSuspend)}
        />
      </section>

      <dl className={styles.facts}>
        <div className={styles.fact}>
          <dt>Bu ay sipariş</dt>
          <dd>{shop.monthlyOrders}</dd>
        </div>
        <div className={styles.fact}>
          <dt>Açık talep</dt>
          <dd>{shop.openTickets}</dd>
        </div>
        <div className={styles.fact}>
          <dt>Ödeme hesabı</dt>
          <dd>{shop.paymentAccount}</dd>
        </div>
        <div className={styles.fact}>
          <dt>Son giriş</dt>
          <dd>{shop.lastLogin ? `${dayText(shop.lastLogin.at)}, ${shop.lastLogin.userName}` : "Kayıt yok"}</dd>
        </div>
      </dl>

      <div className={styles.columns}>
        <div className={styles.mainCol}>
          <section>
            <h2 className={support.h2}>Son siparişler</h2>
            {shop.recentOrders.length === 0 ? (
              <p className={support.empty}>Henüz sipariş yok.</p>
            ) : (
              <div className={support.tableWrap}>
                <table className={support.table}>
                  <thead>
                    <tr>
                      <th>Sipariş</th>
                      <th>Teslim</th>
                      <th>Alıcı</th>
                      <th>Tutar</th>
                      <th>Durum</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shop.recentOrders.map((o) => {
                      const day = relativeDayName(o.deliveryDate, today);
                      return (
                        <tr key={o.id}>
                          <td className={support.nowrap}>
                            <Link href={`/destek/siparisler?ara=${o.number}`}>{o.number}</Link>
                          </td>
                          <td className={support.nowrap}>
                            {["Bugün", "Yarın", "Dün"].includes(day) ? day : formatDayMonth(o.deliveryDate)} {formatShortTimeRange(o.slotStart, o.slotEnd)}
                          </td>
                          <td>{o.recipientName}</td>
                          <td className={support.nowrap}>{formatPrice(o.total)}</td>
                          <td>
                            <StatusTag tone={orderStatusTone[o.status]}>{orderStatusLabel[o.status]}</StatusTag>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section>
            <h2 className={support.h2}>Son bildirimler</h2>
            <div className={support.tableWrap}>
              <table className={support.table}>
                <thead>
                  <tr>
                    <th>Saat</th>
                    <th>Kanal</th>
                    <th>Mesaj</th>
                    <th>Kime</th>
                    <th>Sonuç</th>
                  </tr>
                </thead>
                <tbody>
                  {shop.notifications.map((n) => (
                    <tr key={n.id}>
                      <td className={support.nowrap}>{dayText(n.at)}</td>
                      <td>{n.channel === "sms" ? "SMS" : "E-posta"}</td>
                      <td>{n.text}</td>
                      <td className={support.nowrap}>{n.recipient}</td>
                      <td className={cx(!n.delivered && styles.failed)}>
                        {n.delivered ? "İletildi" : "İletilemedi"}
                        {!n.delivered && n.providerResponse && (
                          <span className={styles.failedReason}>{n.providerResponse}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <span className={support.small}>
              Bu ay {shop.smsUsed} SMS gönderildi, paket sınırı {shop.smsLimit}.
              {shop.smsUsed > shop.smsLimit && " Sınır aşıldı; ek paket gerekebilir."}
            </span>
          </section>

          <section>
            <h2 className={support.h2}>Yorumlar</h2>
            <ReviewModeration shopId={shop.shop.id} reviews={shop.reviews} />
          </section>
        </div>

        <aside className={styles.sideCol}>
          <section>
            <h2 className={support.h2}>
              Ekip notları <span className={styles.h2Sub}>dükkân görmez</span>
            </h2>
            {shop.notes.length ? (
              <ul className={styles.notes}>
                {shop.notes.map((n) => (
                  <li key={n.id} className={styles.note}>
                    <span className={styles.noteHead}>
                      {n.authorName}, {formatDayMonth(zonedNow(new Date(n.at), TZ).date)}
                    </span>
                    <span>{n.text}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className={support.small}>Not yok.</p>
            )}
          </section>
          <section>
            <h2 className={support.h2}>Kullanıcılar</h2>
            <ul className={styles.notes}>
              {shop.users.length === 0 && <li className={styles.note}>Kullanıcı kaydı yok.</li>}
              {shop.users.map((u) => (
                <li key={u.id} className={cx(styles.note, styles.userRow)}>
                  <span>
                    <b>{u.name}</b>
                    <br />
                    <span className={support.small}>{u.role === ShopRole.Owner ? "Dükkân sahibi" : "Çalışan"}</span>
                  </span>
                  <span className={support.small}>{u.lastSeenAt ? dayText(u.lastSeenAt).split(" ")[0] : "—"}</span>
                </li>
              ))}
            </ul>
          </section>
          <section>
            <h2 className={support.h2}>Açık talepler</h2>
            <ul className={styles.notes}>
              {shop.tickets.length === 0 && <li className={styles.note}>Açık talep yok.</li>}
              {shop.tickets.map((t) => (
                <li key={t.id} className={styles.note}>
                  <Link href={`/destek/talepler/${t.id}`} className={support.subject}>
                    {t.subject}
                  </Link>
                  <span className={styles.noteHead}>
                    {t.priority === TicketPriority.Urgent ? "Acil" : "Normal"}, {t.assigneeName ? shortName(t.assigneeName) : "atanmadı"},{" "}
                    {durationText(minutesSince(t.waitingSince))}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>
    </>
  );
}
