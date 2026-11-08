import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { getVisitStats } from "@/lib/api";
import { Channel, type VisitStats } from "@/lib/api/types";
import { channelNames, shareLink } from "@/lib/channel";
import { formatPrice } from "@/lib/format";
import { siteUrl } from "@/lib/share";
import panel from "../_components/panel.module.css";
import { panelSession } from "../_lib";
import { CopyButton } from "./CopyButton";
import styles from "./visits.module.css";

export const metadata: Metadata = { title: "Ziyaretçiler" };

const periods = [
  { days: 7, label: "Son 7 gün", query: "" },
  { days: 30, label: "Son 30 gün", query: "?donem=30" },
] as const;

/** Paylaşım bağlantıları; her biri kanalını `?k=` ile söyler. */
const links = [
  { channel: Channel.Instagram, name: "Instagram biyografisi" },
  { channel: Channel.WhatsApp, name: "WhatsApp mesajları ve durum" },
  { channel: Channel.Google, name: "Google Haritalar profili" },
] as const;

/**
 * Vitrine hangi kanaldan gelindiği ve kaçının sipariş verdiği. Kişi bilgisi tutulmaz; ziyaretler
 * günlük sayılardır (lib/channel.ts, api Visits).
 */
export default function VisitsPage({ searchParams }: PageProps<"/panel/ziyaretciler">) {
  return (
    <Suspense>
      <Visits searchParams={searchParams} />
    </Suspense>
  );
}

async function Visits({ searchParams }: Pick<PageProps<"/panel/ziyaretciler">, "searchParams">) {
  const days = (await searchParams).donem === "30" ? 30 : 7;
  const [{ shop }, stats] = await Promise.all([panelSession(), getVisitStats(days)]);
  const site = siteUrl();
  const display = (url: string) => url.replace(/^https?:\/\//, "");
  const qrUrl = shareLink(site, shop.slug, Channel.Qr);

  return (
    <>
      <header className={panel.pageHead}>
        <div className={panel.pageHeadText}>
          <span className={panel.eyebrow}>Vitrininiz</span>
          <h1 className={panel.pageTitle}>Ziyaretçiler</h1>
        </div>
      </header>
      <div className={styles.page}>
        <div className={styles.intro}>
          <p className={styles.muted}>
            Vitrininize hangi kanaldan gelindiği ve kaçının sipariş verdiği. Kişi bilgisi tutulmaz, yalnızca sayılar.
          </p>
          <nav aria-label="Dönem" className={styles.periods}>
            {periods.map((p) => (
              <Link
                key={p.days}
                href={`/panel/ziyaretciler${p.query}`}
                className={styles.period}
                aria-current={p.days === days ? "page" : undefined}
              >
                {p.label}
              </Link>
            ))}
          </nav>
        </div>

        <section aria-labelledby="kanallar" className={styles.section}>
          <h2 id="kanallar" className={styles.title}>
            Nereden geldiler
          </h2>
          <ChannelTable stats={stats} />
          <p className={styles.caption}>
            &ldquo;Doğrudan&rdquo;: bağlantı yazılarak, yer imiyle ya da kaynağını göstermeyen bir uygulamadan gelenler.
            WhatsApp&apos;ı kesin görmek için aşağıdaki WhatsApp bağlantınızı kullanın.
          </p>
        </section>

        <section aria-labelledby="baglantilar" className={styles.section}>
          <div className={styles.head}>
            <h2 id="baglantilar" className={styles.title}>
              Paylaşım bağlantılarınız
            </h2>
            <p className={styles.muted}>
              Her yere kendi bağlantısını koyun; ziyaretçinin nereden geldiği kesin bilinir. Hepsi aynı vitrini açar.
            </p>
          </div>
          <ul className={styles.links}>
            {links.map((link) => {
              const url = shareLink(site, shop.slug, link.channel);
              return (
                <li key={link.channel} className={styles.link}>
                  <div className={styles.linkText}>
                    <span className={styles.strong}>{link.name}</span>
                    <span className={styles.url}>{display(url)}</span>
                  </div>
                  <CopyButton text={url} label={link.name} />
                </li>
              );
            })}
            <li className={styles.link}>
              <div className={styles.linkText}>
                <span className={styles.strong}>Dükkândaki tabela, kartvizit</span>
                <span className={styles.url}>QR kod: {display(qrUrl)}</span>
              </div>
              <a href="/panel/ziyaretciler/qr" download className="tm-btn tm-btn--secondary tm-btn--s">
                QR kodu indir
              </a>
            </li>
          </ul>
        </section>
      </div>
    </>
  );
}

function ChannelTable({ stats }: { stats: VisitStats }) {
  if (stats.channels.length === 0) {
    return (
      <p className={styles.muted}>
        Bu dönemde henüz ziyaret yok. Aşağıdaki bağlantılardan birini Instagram biyografinize ya da WhatsApp durumunuza
        koyun.
      </p>
    );
  }
  const top = Math.max(...stats.channels.map((c) => c.visits), 1);
  const best = [...stats.channels].sort((a, b) => b.orders - a.orders)[0];
  return (
    <>
      <p className={styles.summary}>
        <strong>
          {stats.visits.toLocaleString("tr-TR")} ziyaret, {stats.orders} sipariş, {formatPrice(stats.revenue)}.
        </strong>
        {best.orders > 0 && ` En çok sipariş ${fromChannel(best.channel)} geldi.`}
      </p>
      <table className={styles.table}>
        <thead>
          <tr>
            <th scope="col">Kanal</th>
            <th scope="col" className={styles.shareCol}>
              <span className={styles.visuallyHidden}>Pay</span>
            </th>
            <th scope="col" className={styles.num}>
              Ziyaret
            </th>
            <th scope="col" className={styles.num}>
              Sipariş
            </th>
            <th scope="col" className={styles.num}>
              Ciro
            </th>
          </tr>
        </thead>
        <tbody>
          {stats.channels.map((c) => (
            <tr key={c.channel}>
              <th scope="row" className={styles.strong}>
                {channelNames[c.channel]}
              </th>
              <td className={styles.shareCol}>
                <div className={styles.bar} aria-hidden="true">
                  <div className={styles.fill} style={{ width: `${Math.round((c.visits / top) * 100)}%` }} />
                </div>
              </td>
              <td className={styles.num}>{c.visits.toLocaleString("tr-TR")}</td>
              <td className={styles.num}>{c.orders}</td>
              <td className={styles.num}>{formatPrice(c.revenue)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

/** "Instagram'dan", "QR koddan": özetteki ek. */
function fromChannel(channel: Channel): string {
  const suffix: Record<Channel, string> = {
    [Channel.Instagram]: "Instagram'dan",
    [Channel.WhatsApp]: "WhatsApp'tan",
    [Channel.Google]: "Google'dan",
    [Channel.Facebook]: "Facebook'tan",
    [Channel.Qr]: "QR koddan",
    [Channel.Tomurcuk]: "Tomurcuk ana sayfasından",
    [Channel.Other]: "başka sitelerden",
    [Channel.Direct]: "doğrudan gelenlerden",
  };
  return suffix[channel];
}
