// Takip sayfasının metinleri ve durum çizelgesi. Takip.dc.html'deki kurgu:
// dört adım, tamamlananlar zamanıyla, bekleyenler ne zaman olacağıyla yazılır.
import { OrderStatus, PaymentStatus, type OrderTracking, type Shop } from "@/lib/api/types";
import { daysBetween, formatDayMonth, formatLongDate } from "@/lib/dates";
import { formatTimeRange, withDativeSuffix, withTimeSuffix, zonedNow } from "@/lib/format";

export interface TrackingStep {
  label: string;
  time: string;
  done: boolean;
  current: boolean;
}

export interface TrackingView {
  title: string;
  lede: string;
  /** Teslim edilemedi ve iptal hallerinde çizelge gösterilmez. */
  steps: TrackingStep[] | null;
  photoCaption: string | null;
  paymentPending: boolean;
}

const FLOW: OrderStatus[] = [OrderStatus.New, OrderStatus.Preparing, OrderStatus.OnWay, OrderStatus.Delivered];

/** "bugün", "yarın" ya da "23 Ekim Cuma" */
function dayWord(date: string, today: string): string {
  const diff = daysBetween(today, date);
  if (diff === 0) return "bugün";
  if (diff === 1) return "yarın";
  return formatLongDate(date);
}

export function buildTrackingView(order: OrderTracking, shop: Shop, now: Date): TrackingView {
  const today = zonedNow(now, shop.timeZone).date;
  const at = (iso: string) => zonedNow(new Date(iso), shop.timeZone);
  const eventOf = (status: OrderStatus) => order.events.find((e) => e.status === status);
  const range = formatTimeRange(order.slotStart, order.slotEnd);
  const recipient = withDativeSuffix(order.recipientName);
  const delivered = eventOf(OrderStatus.Delivered);
  const deliveredAt = delivered ? at(delivered.at) : null;

  const steps = (): TrackingStep[] => {
    const reached = FLOW.indexOf(order.status);
    const pending: Record<OrderStatus, string> = {
      [OrderStatus.New]: "",
      [OrderStatus.Preparing]:
        daysBetween(today, order.deliveryDate) <= 0
          ? "Bugün başlar"
          : daysBetween(today, order.deliveryDate) === 1
            ? "Yarın sabah başlar"
            : `${formatDayMonth(order.deliveryDate)} sabahı başlar`,
      [OrderStatus.OnWay]: "Yola çıkınca SMS gelir",
      [OrderStatus.Delivered]: `${formatDayMonth(order.deliveryDate)}, ${range} arası`,
      [OrderStatus.Failed]: "",
      [OrderStatus.Cancelled]: "",
    };
    const labels = ["Sipariş alındı", "Hazırlanıyor", "Yolda", "Teslim edildi"];
    return FLOW.map((status, index) => {
      const event = eventOf(status);
      const when = event ? at(event.at) : null;
      const doneText =
        when && status === OrderStatus.OnWay && order.courierName
          ? `Kurye ${order.courierName}, ${when.time}`
          : when
            ? `${formatDayMonth(when.date)}, ${when.time}`
            : "";
      return {
        label: labels[index],
        time: index <= reached ? doneText : pending[status],
        done: index <= reached,
        current: index === reached,
      };
    });
  };

  const base = {
    photoCaption: null,
    paymentPending: order.paymentStatus === PaymentStatus.Pending,
  };

  switch (order.status) {
    case OrderStatus.OnWay:
      return {
        ...base,
        title: "Siparişiniz yolda",
        lede: order.deliveryTime
          ? `${order.courierName ? `Kurye ${order.courierName} yolda. ` : ""}Siparişiniz ${order.deliveryTime} civarında ${recipient} ulaşır.`
          : `Siparişiniz ${range} arasında ${recipient} ulaşır.`,
        steps: steps(),
      };
    case OrderStatus.Delivered:
      return {
        ...base,
        title: "Teslim edildi",
        lede: deliveredAt
          ? `Siparişiniz ${withTimeSuffix(deliveredAt.time, "locative")} ${recipient} teslim edildi.`
          : `Siparişiniz ${recipient} teslim edildi.`,
        steps: steps(),
        photoCaption:
          order.deliveryPhotoUrl && deliveredAt
            ? `Teslim fotoğrafı${order.courierName ? `, ${order.courierName} çekti` : ""}. ${formatDayMonth(deliveredAt.date)}, ${deliveredAt.time}`
            : null,
      };
    case OrderStatus.Failed:
      return {
        ...base,
        title: "Teslim edilemedi",
        lede: `Kurye ${recipient} ulaşamadı. ${shop.shortName} sizi arayıp yeni bir teslim saati belirleyecek.`,
        steps: null,
      };
    case OrderStatus.Cancelled:
      return {
        ...base,
        title: "Sipariş iptal edildi",
        lede: "Bu sipariş iptal edildi. Ödeme yaptıysanız iade aynı karta yapılır.",
        steps: null,
      };
    default:
      return {
        ...base,
        title: "Siparişiniz alındı",
        lede: `${shop.name} siparişinizi ${dayWord(order.deliveryDate, today)} ${range} arasında ${recipient} teslim edecek.`,
        steps: steps(),
      };
  }
}
