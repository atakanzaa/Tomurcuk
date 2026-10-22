import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { OrderList, OrderRow } from "@/components/ui/OrderRow";
import { getCustomers, getOrders } from "@/lib/api";
import { OrderStatus, type Order } from "@/lib/api/types";
import { formatDayMonth, relativeDayName } from "@/lib/dates";
import { formatPrice, zonedNow } from "@/lib/format";
import { orderItemsSummary, orderStatusTag, orderTimeColumn } from "@/lib/order";
import panel from "../_components/panel.module.css";
import { panelSession } from "../_lib";

export const metadata: Metadata = { title: "Siparişler" };

const StatusFilter = {
  All: "",
  New: "yeni",
  Active: "hazirlaniyor",
  Done: "teslim",
  Problem: "sorunlu",
} as const;
type StatusFilter = (typeof StatusFilter)[keyof typeof StatusFilter];

const filters: { value: StatusFilter; label: string; test: (o: Order) => boolean }[] = [
  { value: StatusFilter.All, label: "Hepsi", test: () => true },
  { value: StatusFilter.New, label: "Yeni", test: (o) => o.status === OrderStatus.New },
  { value: StatusFilter.Active, label: "Hazırlanıyor ve yolda", test: (o) => o.status === OrderStatus.Preparing || o.status === OrderStatus.OnWay },
  { value: StatusFilter.Done, label: "Teslim edildi", test: (o) => o.status === OrderStatus.Delivered },
  { value: StatusFilter.Problem, label: "İptal ve teslim edilemedi", test: (o) => o.status === OrderStatus.Cancelled || o.status === OrderStatus.Failed },
];

export default function OrdersPage({ searchParams }: PageProps<"/panel/siparisler">) {
  return (
    <Suspense>
      <Orders searchParams={searchParams} />
    </Suspense>
  );
}

async function Orders({ searchParams }: Pick<PageProps<"/panel/siparisler">, "searchParams">) {
  const [{ shop }, query] = await Promise.all([panelSession(), searchParams]);
  const text = (typeof query.ara === "string" ? query.ara : "").trim();
  const filter = filters.find((f) => f.value === query.durum) ?? filters[0];
  const [orders, customers] = await Promise.all([getOrders(shop.id), getCustomers(shop.id)]);
  const today = zonedNow(new Date(), shop.timeZone).date;

  const needle = text.toLocaleLowerCase("tr");
  const digits = needle.replace(/\D/g, "");
  const matches = (o: Order) => {
    if (!needle) return true;
    const sender = customers.find((c) => c.id === o.customerId);
    const phones = [o.recipientPhone, sender?.phone ?? ""].map((p) => p.replace(/\D/g, ""));
    return (
      o.number.toLocaleLowerCase("tr").includes(needle) ||
      o.recipientName.toLocaleLowerCase("tr").includes(needle) ||
      (sender?.name.toLocaleLowerCase("tr").includes(needle) ?? false) ||
      (digits.length >= 3 && phones.some((p) => p.includes(digits)))
    );
  };
  const visible = orders.filter((o) => filter.test(o) && matches(o)).sort((a, b) => b.deliveryDate.localeCompare(a.deliveryDate) || a.slotStart.localeCompare(b.slotStart));
  const days = [...new Set(visible.map((o) => o.deliveryDate))];
  const href = (durum: string) => {
    const params = new URLSearchParams({ ...(text ? { ara: text } : {}), ...(durum ? { durum } : {}) });
    return `/panel/siparisler${params.size ? `?${params}` : ""}`;
  };

  return (
    <>
      <header className={panel.pageHead}>
        <div className={panel.pageHeadText}>
          <span className={panel.eyebrow}>{shop.name}</span>
          <h1 className={panel.pageTitle}>Siparişler</h1>
        </div>
      </header>
      <form className={panel.searchForm} role="search">
        <label>
          <span className="visually-hidden">Sipariş ara</span>
          <input className="tm-field__control" type="search" name="ara" defaultValue={text} placeholder="İsim, telefon veya sipariş no" />
        </label>
        {filter.value && <input type="hidden" name="durum" value={filter.value} />}
        <button type="submit" className="tm-btn tm-btn--secondary">
          Ara
        </button>
      </form>
      <nav aria-label="Durum" className={panel.tabs}>
        {filters.map((f) => (
          <Link key={f.value} href={href(f.value)} className={panel.tabLink} aria-current={f === filter ? "page" : undefined}>
            {f.label} <span className={panel.tabCount}>{orders.filter((o) => f.test(o) && matches(o)).length}</span>
          </Link>
        ))}
      </nav>
      <div className={panel.section}>
        {visible.length === 0 ? (
          <p className={panel.empty}>{text ? `"${text}" ile eşleşen sipariş yok.` : "Bu durumda sipariş yok."}</p>
        ) : (
          days.map((date) => {
            const name = relativeDayName(date, today);
            return (
              <div key={date}>
                <h2 className={panel.groupTitle}>
                  <span>{["Bugün", "Yarın", "Dün"].includes(name) ? `${name}, ${formatDayMonth(date)}` : `${formatDayMonth(date)} ${name}`}</span>
                  <span>{visible.filter((o) => o.deliveryDate === date).length}</span>
                </h2>
                <OrderList>
                  {visible
                    .filter((o) => o.deliveryDate === date)
                    .map((order) => {
                      const { time, slot } = orderTimeColumn(order);
                      return (
                        <OrderRow
                          key={order.id}
                          href={`/panel/siparisler/${order.id}`}
                          time={time}
                          slot={slot}
                          recipient={order.recipientName || order.number}
                          place={order.zoneName}
                          items={orderItemsSummary(order)}
                          status={orderStatusTag(order)}
                          amount={formatPrice(order.total)}
                        />
                      );
                    })}
                </OrderList>
              </div>
            );
          })
        )}
      </div>
    </>
  );
}
