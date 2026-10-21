import { CaretLeft } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Button } from "@/components/ui/Button";
import { StatusTag } from "@/components/ui/StatusTag";
import { getCannedReplies, getSupportUser, getTicket } from "@/lib/api";
import { PaymentStatus, SupportRole, TicketPriority, type SupportOrderView } from "@/lib/api/types";
import { cx } from "@/lib/cx";
import { formatDayMonth, relativeDayName } from "@/lib/dates";
import { formatPrice, formatTimeRange, zonedNow } from "@/lib/format";
import { shortName } from "@/lib/mask";
import { escalate } from "@/lib/support-actions";
import { firstResponseState, ticketCategoryLabel, ticketStatusTag } from "@/lib/support";
import { orderStatusLabel, orderStatusTone } from "@/lib/order";
import support from "../../_components/support.module.css";
import { PhoneReveal } from "./PhoneReveal";
import { ReplyForm } from "./ReplyForm";
import styles from "./ticket.module.css";

export const metadata: Metadata = { title: "Talep" };

const TIME_ZONE = "Europe/Istanbul";

export default function TicketPage({ params }: PageProps<"/destek/talepler/[id]">) {
  return (
    <Suspense>
      <Ticket params={params} />
    </Suspense>
  );
}

async function Ticket({ params }: Pick<PageProps<"/destek/talepler/[id]">, "params">) {
  const { id } = await params;
  const [ticket, canned, user] = await Promise.all([getTicket(id), getCannedReplies(), getSupportUser()]);
  if (!ticket) notFound();
  const deadline = firstResponseState(ticket);
  const urgent = ticket.priority === TicketPriority.Urgent;
  const tag = ticketStatusTag[ticket.status];

  return (
    <>
      <Link href="/destek" className={support.back}>
        <CaretLeft size={16} aria-hidden="true" />
        Talepler
      </Link>
      <div className={styles.head}>
        <div className={styles.headText}>
          <div className={styles.meta}>
            <span className={urgent ? support.urgent : support.small}>{urgent ? "Acil" : "Normal"}</span>
            <StatusTag tone={tag.tone}>{tag.label}</StatusTag>
            <span className={support.small}>
              {ticketCategoryLabel[ticket.category]}, {ticket.shopName}
            </span>
          </div>
          <h1 className={styles.title}>{ticket.subject}</h1>
        </div>
        <div className={styles.deadline}>
          {deadline && (
            <span className={cx(styles.deadlineText, (urgent || deadline.overdue) && styles.deadlineUrgent)}>
              {deadline.overdue ? `İlk yanıt süresi ${deadline.minutes} dk aşıldı` : `İlk yanıt için ${deadline.minutes} dk kaldı`}
            </span>
          )}
          <span className={support.small}>Atanan: {ticket.assigneeName ? shortName(ticket.assigneeName) : "atanmadı"}</span>
        </div>
      </div>

      <div className={styles.columns}>
        <section aria-label="Yazışma" className={styles.thread}>
          <div className={styles.messages}>
            {ticket.messages.map((m) => (
              <div key={m.id} className={cx(styles.message, m.internal && styles.internal)}>
                <div className={styles.messageHead}>
                  <span>
                    <b>{m.authorName}</b>, {m.authorOrg}
                  </span>
                  <span>{zonedNow(new Date(m.at), TIME_ZONE).time}</span>
                </div>
                <p className={styles.messageBody}>{m.text}</p>
              </div>
            ))}
          </div>
          <ReplyForm ticketId={ticket.id} canned={canned.filter((c) => c.category === ticket.category).concat(canned.filter((c) => c.category !== ticket.category))} />
        </section>

        <aside aria-label={ticket.orderNumber ? `Sipariş ${ticket.orderNumber}` : "Dükkân"} className={styles.aside}>
          {ticket.order ? (
            <OrderCard order={ticket.order} ticketSubject={ticket.subject} />
          ) : ticket.orderNumber ? (
            <>
              <h2 className={styles.asideTitle}>Sipariş {ticket.orderNumber}</h2>
              <p className={styles.missingOrder}>
                Bu numarayla sistemde sipariş yok. Ödeme sağlayıcının kayıtlarında arayın: ödeme alındıysa callback gelmemiş olabilir,
                zamanlanmış sorgu 15 dakikada bir durumu yeniler.
              </p>
            </>
          ) : (
            <>
              <h2 className={styles.asideTitle}>{ticket.shopName}</h2>
              <p className={support.small}>Bu talep bir siparişe bağlı değil.</p>
            </>
          )}
          <div className={styles.asideButtons}>
            <Button variant="secondary" size="s" href={`/destek/dukkanlar/${ticket.shopId}`}>
              Dükkân özeti
            </Button>
            {user.role === SupportRole.Agent && (
              <form action={escalate.bind(null, ticket.id)}>
                <Button type="submit" variant="secondary" size="s" block>
                  Lidere aktar
                </Button>
              </form>
            )}
          </div>
        </aside>
      </div>
    </>
  );
}

function OrderCard({ order, ticketSubject }: { order: SupportOrderView; ticketSubject: string }) {
  const today = zonedNow(new Date(), TIME_ZONE).date;
  const day = relativeDayName(order.deliveryDate, today);
  const context = `Talep: ${ticketSubject}`;
  return (
    <>
      <div className={styles.asideHead}>
        <h2 className={styles.asideTitle}>Sipariş {order.number}</h2>
        <StatusTag tone={orderStatusTone[order.status]}>{orderStatusLabel[order.status]}</StatusTag>
      </div>
      <dl className={styles.kv}>
        <dt>Teslim</dt>
        <dd>
          {["Bugün", "Yarın", "Dün"].includes(day) ? day : formatDayMonth(order.deliveryDate)}, {formatTimeRange(order.slotStart, order.slotEnd)}
        </dd>
        <dt>Alıcı</dt>
        <dd>{order.recipientName}</dd>
        <dt>Telefon</dt>
        <dd>
          <PhoneReveal orderId={order.id} field="recipient" masked={order.recipientPhone} context={context} />
        </dd>
        <dt>Adres</dt>
        <dd>{order.address}</dd>
        <dt>Gönderen</dt>
        <dd>
          {order.senderName},{" "}
          <PhoneReveal orderId={order.id} field="sender" masked={order.senderPhone} context={context} />
        </dd>
        <dt>Tutar</dt>
        <dd>
          {formatPrice(order.total)}, {order.paymentStatus === PaymentStatus.Paid ? (order.paymentMethod === "card" ? "kartla ödendi" : "ödendi") : "ödenmedi"}
        </dd>
      </dl>
      <span className={support.small}>Telefonu açmak için gerekçe istenir ve denetim kaydına yazılır.</span>
      <div>
        <h3 className={styles.timelineTitle}>Zaman çizelgesi</h3>
        <ol className={styles.timeline}>
          {order.timeline.map((e, i) => {
            const when = zonedNow(new Date(e.at), TIME_ZONE);
            const label = when.date === today ? when.time : relativeDayName(when.date, today).toLocaleLowerCase("tr");
            return (
              <li key={i} className={cx(styles.event, e.failed && styles.eventFailed)}>
                <span className={styles.eventTime}>{label === "dün" || when.date === today ? label : formatDayMonth(when.date)}</span>
                <span>
                  {e.text}
                  <span className={styles.eventWho}>
                    {e.actor}
                    {when.date !== today && `, ${when.time}`}
                  </span>
                </span>
              </li>
            );
          })}
        </ol>
      </div>
    </>
  );
}
