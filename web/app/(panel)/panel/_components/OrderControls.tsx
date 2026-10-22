"use client";

import { DotsThreeVertical, Printer } from "@phosphor-icons/react";
import Link from "next/link";
import { useActionState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/Button";
import { OrderStatus, PaymentMethod, PaymentStatus } from "@/lib/api/types";
import { changeOrderStatus, markPaid } from "@/lib/panel/actions";
import { initialNotice } from "@/lib/panel/notice";
import { canTransition, primaryTransition, transitionAction } from "@/lib/order-flow";
import { Toast } from "./Toast";
import styles from "./order.module.css";

interface OrderRef {
  id: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
}

/** Birincil durum butonu ve fiş. Kartla ödemesi onaylanmamış sipariş hazırlanmaz. */
export function OrderActions({ order, inline }: { order: OrderRef; inline?: boolean }) {
  const [notice, action] = useActionState(changeOrderStatus, initialNotice);
  const next = primaryTransition(order.status);
  const awaitingPayment = order.paymentMethod === PaymentMethod.Card && order.paymentStatus !== PaymentStatus.Paid;
  const blocked = next === OrderStatus.Preparing && awaitingPayment;

  return (
    <div className={inline ? styles.actionsInline : styles.actions}>
      <div className={styles.actionsInner}>
        <Link href={`/panel/fisler?siparis=${order.id}`} className={`tm-btn tm-btn--secondary ${styles.printButton}`} aria-label="Fişi yazdır">
          <Printer size={20} aria-hidden="true" />
        </Link>
        {next ? (
          <form action={action} className={styles.primaryForm}>
            <input type="hidden" name="orderId" value={order.id} />
            <input type="hidden" name="status" value={next} />
            <Button type="submit" block disabled={blocked} aria-describedby={blocked ? `odeme-${order.id}` : undefined}>
              {transitionAction[next]}
            </Button>
          </form>
        ) : (
          <span className={styles.finalState}>Bu sipariş için yapılacak iş kalmadı.</span>
        )}
      </div>
      {blocked && (
        <span id={`odeme-${order.id}`} className={styles.blockedReason}>
          Ödeme bekleniyor. Sağlayıcıdan onay gelince hazırlayabilirsiniz.
        </span>
      )}
      <Toast notice={notice} />
    </div>
  );
}

/** "Diğer işlemler": ödendi işaretleme, teslim edilemedi, iptal (onaylı). */
export function OrderMenu({ order, canCancel }: { order: OrderRef; canCancel: boolean }) {
  const [statusNotice, statusAction] = useActionState(changeOrderStatus, initialNotice);
  const [paidNotice, paidAction] = useActionState(markPaid, initialNotice);
  const menuRef = useRef<HTMLDetailsElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (menuRef.current) menuRef.current.open = false;
    dialogRef.current?.close();
  }, [statusNotice.version, paidNotice.version]);

  const unpaid = order.paymentStatus !== PaymentStatus.Paid && order.paymentMethod !== PaymentMethod.Card;
  const canFail = canTransition(order.status, OrderStatus.Failed);
  const cancel = canCancel && canTransition(order.status, OrderStatus.Cancelled);
  if (!unpaid && !canFail && !cancel) return null;

  return (
    <>
      <details ref={menuRef} className={styles.menu}>
        <summary className={styles.menuButton} aria-label="Diğer işlemler">
          <DotsThreeVertical size={20} aria-hidden="true" />
        </summary>
        <div className={styles.menuPanel}>
          {unpaid && (
            <form action={paidAction}>
              <input type="hidden" name="orderId" value={order.id} />
              <button type="submit" className={styles.menuItem}>
                Ödendi olarak işaretle
              </button>
            </form>
          )}
          {canFail && (
            <form action={statusAction}>
              <input type="hidden" name="orderId" value={order.id} />
              <input type="hidden" name="status" value={OrderStatus.Failed} />
              <button type="submit" className={styles.menuItem}>
                {transitionAction[OrderStatus.Failed]}
              </button>
            </form>
          )}
          {cancel && (
            <button type="button" className={`${styles.menuItem} ${styles.menuDanger}`} onClick={() => dialogRef.current?.showModal()}>
              {transitionAction[OrderStatus.Cancelled]}
            </button>
          )}
        </div>
      </details>
      {cancel && (
        <dialog ref={dialogRef} className={styles.dialog} aria-labelledby={`iptal-${order.id}`}>
          <h2 id={`iptal-${order.id}`} className={styles.dialogTitle}>
            Siparişi iptal etmek istiyor musunuz?
          </h2>
          <p className={styles.dialogText}>
            Bu geri alınamaz. Gönderene iptal SMS&apos;i gider; ödeme yapıldıysa iadeyi ayrıca başlatırsınız.
          </p>
          <div className={styles.dialogActions}>
            <Button variant="secondary" onClick={() => dialogRef.current?.close()}>
              Vazgeç
            </Button>
            <form action={statusAction}>
              <input type="hidden" name="orderId" value={order.id} />
              <input type="hidden" name="status" value={OrderStatus.Cancelled} />
              <Button type="submit" variant="danger">
                Siparişi iptal et
              </Button>
            </form>
          </div>
        </dialog>
      )}
      <Toast notice={statusNotice} />
      <Toast notice={paidNotice} />
    </>
  );
}
