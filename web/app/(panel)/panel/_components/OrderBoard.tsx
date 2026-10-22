import { MagnifyingGlass, Plus } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { KraftBand } from "@/components/ui/KraftBand";
import { OrderList, OrderRow } from "@/components/ui/OrderRow";
import { getCustomer, getOrders } from "@/lib/api";
import { OrderStatus, type Order, type PanelSession } from "@/lib/api/types";
import { cx } from "@/lib/cx";
import { formatDayMonth, formatLongDate, relativeDayName } from "@/lib/dates";
import { formatPrice } from "@/lib/format";
import { orderDelayMinutes, orderItemsSummary, orderStatusTag, orderTimeColumn } from "@/lib/order";
import { DayView, dayRange, dayViewLabel, panelCounts } from "../_lib";
import { OrderDetail } from "./OrderDetail";
import styles from "./board.module.css";
import panel from "./panel.module.css";

interface OrderBoardProps {
  session: PanelSession;
  view: DayView;
  /** Seçili sipariş: mobilde tam ekran detay, masaüstünde listenin yanında. */
  selected?: Order | null;
}

const viewQuery = (view: DayView) => (view === DayView.Today ? "" : `?gun=${view}`);

/** Gün görünümünde öğleden önce/sonra, haftalık görünümde güne göre gruplar. */
function groupOrders(orders: Order[], view: DayView, today: string) {
  if (view === DayView.Week) {
    const days = [...new Set(orders.map((o) => o.deliveryDate))];
    return days.map((date) => {
      const name = relativeDayName(date, today);
      const title = name === "Bugün" || name === "Yarın" ? name : `${name}, ${formatDayMonth(date)}`;
      return { title, orders: orders.filter((o) => o.deliveryDate === date) };
    });
  }
  return [
    { title: "Öğleden önce", orders: orders.filter((o) => o.slotStart < "13:00") },
    { title: "Öğleden sonra", orders: orders.filter((o) => o.slotStart >= "13:00") },
  ].filter((g) => g.orders.length);
}

export async function OrderBoard({ session, view, selected }: OrderBoardProps) {
  const { shop, user } = session;
  const { now, today, from, to } = dayRange(view, shop.timeZone);
  const [orders, counts, customer] = await Promise.all([
    getOrders(shop.id, { from, to }),
    panelCounts(shop.id, shop.timeZone),
    selected ? getCustomer(shop.id, selected.customerId) : null,
  ]);
  const active = orders.filter((o) => o.status !== OrderStatus.Cancelled);
  const delay = (o: Order) => (o.deliveryDate === today ? orderDelayMinutes(o, now.time) : 0);
  const newOrders = active.filter((o) => o.status === OrderStatus.New);
  const lateCount = active.filter((o) => delay(o) > 0).length;
  const total = active.reduce((sum, o) => sum + o.total, 0);
  const Title = selected ? "p" : "h1";

  const summary = [
    `${newOrders.length ? `${newOrders.length} yeni sipariş onayınızı bekliyor` : "Onay bekleyen yeni sipariş yok"}`,
    lateCount ? `${lateCount} sipariş gecikti` : "",
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div className={styles.board} data-selected={Boolean(selected)}>
      <div className={styles.boardHead}>
        <header className={panel.pageHead}>
          <div className={panel.pageHeadText}>
            <span className={panel.eyebrow}>{formatLongDate(today)}</span>
            <Title className={panel.pageTitle}>{dayViewLabel[view]}</Title>
          </div>
          <Link href="/panel/siparisler" className={cx(panel.iconLink, styles.searchMobile)} aria-label="Sipariş ara">
            <MagnifyingGlass size={24} aria-hidden="true" />
          </Link>
          <form action="/panel/siparisler" className={styles.searchDesktop} role="search">
            <label>
              <span className="visually-hidden">Sipariş ara</span>
              <input className="tm-field__control" name="ara" placeholder="İsim, telefon veya sipariş no" />
            </label>
            <Link href={`/panel/fisler${viewQuery(view) || "?gun=bugun"}`} className={cx("tm-btn tm-btn--secondary", styles.printAll)}>
              {view === DayView.Tomorrow ? "Yarının" : view === DayView.Week ? "Haftanın" : "Bugünün"} fişlerini yazdır
            </Link>
          </form>
        </header>

        {newOrders.length > 0 && (
          <div className={cx(styles.band, styles.bandMobile)}>
            <KraftBand
              tone="peony"
              action={
                <Link href={`/panel/siparisler/${newOrders[0].id}${viewQuery(view)}`} className={styles.bandLink}>
                  Gör
                </Link>
              }
            >
              <strong>{newOrders.length} yeni sipariş</strong> onayınızı bekliyor.
            </KraftBand>
          </div>
        )}
        <div className={cx(styles.band, styles.bandDesktop)}>
          <KraftBand>
            <strong>{active.length} teslimat</strong>, toplam {formatPrice(total)}. {summary}.
          </KraftBand>
        </div>
      </div>

      <div className={styles.columns}>
        <section aria-label={`${dayViewLabel[view]} siparişleri`} className={styles.lists}>
          <nav aria-label="Gün" className={cx(panel.tabs, styles.tabsInline)}>
            {Object.values(DayView).map((v) => (
              <Link key={v} href={`/panel${viewQuery(v)}`} className={panel.tabLink} aria-current={v === view ? "page" : undefined}>
                {dayViewLabel[v]} <span className={panel.tabCount}>{counts[v]}</span>
              </Link>
            ))}
          </nav>
          <div className={cx(panel.section, styles.listSection)}>
            {active.length === 0 ? (
              <p className={panel.empty}>
                {view === DayView.Today ? "Bugün teslim edilecek sipariş yok." : "Bu tarihlerde sipariş yok."}{" "}
                <Link href="/panel/siparisler/yeni">Sipariş ekleyin</Link>
              </p>
            ) : (
              groupOrders(active, view, today).map((group) => (
                <div key={group.title}>
                  <h2 className={panel.groupTitle}>
                    <span>{group.title}</span>
                    <span>{group.orders.length}</span>
                  </h2>
                  <OrderList>
                    {group.orders.map((order) => {
                      const minutes = delay(order);
                      const { time, slot } = orderTimeColumn(order, minutes);
                      return (
                        <OrderRow
                          key={order.id}
                          href={`/panel/siparisler/${order.id}${viewQuery(view)}`}
                          time={time}
                          slot={slot}
                          recipient={order.recipientName}
                          place={order.zoneName}
                          items={orderItemsSummary(order)}
                          status={orderStatusTag(order)}
                          amount={formatPrice(order.total)}
                          late={minutes > 0}
                          selected={order.id === selected?.id}
                        />
                      );
                    })}
                  </OrderList>
                </div>
              ))
            )}
          </div>
        </section>

        <aside aria-label="Sipariş detayı" className={styles.aside}>
          {selected ? (
            <OrderDetail
              order={selected}
              customer={customer}
              today={today}
              timeZone={shop.timeZone}
              role={user.role}
              backHref={`/panel${viewQuery(view)}`}
              backLabel={dayViewLabel[view]}
            />
          ) : (
            <p className={styles.asideEmpty}>Detayını görmek için listeden bir sipariş seçin.</p>
          )}
        </aside>
      </div>

      <Button href="/panel/siparisler/yeni" className={styles.fab}>
        <Plus size={20} aria-hidden="true" />
        Sipariş ekle
      </Button>
    </div>
  );
}
