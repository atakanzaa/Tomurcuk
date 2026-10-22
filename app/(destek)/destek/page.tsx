import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Button } from "@/components/ui/Button";
import { KraftBand } from "@/components/ui/KraftBand";
import { getSupportUser, getTickets } from "@/lib/api";
import { TicketPriority, TicketStatus, type TicketSummary } from "@/lib/api/types";
import { zonedNow } from "@/lib/format";
import { TicketTable } from "./_components/TicketTable";
import styles from "./_components/support.module.css";

export const metadata: Metadata = { title: "Talepler" };

const View = { All: "", Mine: "bana-atanan", Urgent: "acil", Waiting: "dukkan-bekleniyor", Resolved: "cozulenler" } as const;
type View = (typeof View)[keyof typeof View];

export default function TicketsPage({ searchParams }: PageProps<"/destek">) {
  return (
    <Suspense>
      <Tickets searchParams={searchParams} />
    </Suspense>
  );
}

async function Tickets({ searchParams }: Pick<PageProps<"/destek">, "searchParams">) {
  const [tickets, user, query] = await Promise.all([getTickets(), getSupportUser(), searchParams]);
  const open = tickets.filter((t) => t.status !== TicketStatus.Resolved);
  const views: { value: View; label: string; list: TicketSummary[] }[] = [
    { value: View.All, label: "Hepsi", list: open },
    { value: View.Mine, label: "Bana atanan", list: open.filter((t) => t.assigneeId === user.id) },
    { value: View.Urgent, label: "Acil", list: open.filter((t) => t.priority === TicketPriority.Urgent) },
    { value: View.Waiting, label: "Dükkân bekleniyor", list: open.filter((t) => t.status === TicketStatus.WaitingShop) },
    { value: View.Resolved, label: "Çözülenler", list: tickets.filter((t) => t.status === TicketStatus.Resolved) },
  ];
  const current = views.find((v) => v.value === query.gorunum) ?? views[0];
  const urgent = open.filter((t) => t.priority === TicketPriority.Urgent);
  const unassigned = urgent.filter((t) => !t.assigneeId).length;
  const today = zonedNow(new Date(), "Europe/Istanbul").date;

  return (
    <>
      <div className={styles.pageHead}>
        <h1 className={styles.title}>Talepler</h1>
        <span className={styles.muted}>Acil taleplerde ilk yanıt hedefi 15 dk, diğerlerinde 4 saat.</span>
      </div>
      {urgent.length > 0 && (
        <KraftBand
          action={
            <Button size="s" href={`/destek/talepler/${urgent[0].id}`}>
              İlk acil talebi aç
            </Button>
          }
        >
          <strong>{urgent.length} acil talep</strong> bugün teslim edilecek siparişlerle ilgili.
          {unassigned > 0 && ` ${unassigned === urgent.length && unassigned > 1 ? "Hiçbiri" : unassigned === 1 ? "Biri" : `${unassigned} tanesi`} henüz kimseye atanmadı.`}
        </KraftBand>
      )}
      <div>
        <nav aria-label="Talep görünümü" className={styles.tabs}>
          {views.map((v) => (
            <Link key={v.label} href={v.value ? `/destek?gorunum=${v.value}` : "/destek"} className={styles.tab} aria-current={v === current ? "page" : undefined}>
              {v.label} {v.value !== View.Resolved && <span className={styles.navCount}>{v.list.length}</span>}
            </Link>
          ))}
        </nav>
        <TicketTable tickets={current.list} today={today} />
      </div>
    </>
  );
}
