import { X } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { getDeliveryDays, getDeliveryZones, getProducts, getTimeSlots } from "@/lib/api";
import { OptionKind } from "@/lib/api/types";
import { panelSession } from "../../_lib";
import { NewOrderForm, type ProductChoice } from "./NewOrderForm";
import styles from "./newOrder.module.css";

export const metadata: Metadata = { title: "Yeni sipariş" };

export default function NewOrderPage() {
  return (
    <>
      <header className={styles.header}>
        <Link href="/panel" className={styles.close} aria-label="Kapat">
          <X size={24} aria-hidden="true" />
        </Link>
        <h1 className={styles.title}>Yeni sipariş</h1>
      </header>
      <Suspense>
        <NewOrder />
      </Suspense>
    </>
  );
}

async function NewOrder() {
  const { shop } = await panelSession();
  const [products, zones, days, slots] = await Promise.all([
    getProducts(shop.id),
    getDeliveryZones(shop.id),
    getDeliveryDays(shop.id, 14),
    getTimeSlots(shop.id),
  ]);
  // Boy seçeneği olan ürün her boy için ayrı satır: "Mevsim buketi, orta".
  const choices: ProductChoice[] = products.flatMap((p): ProductChoice[] => {
    const sizes = p.options.filter((o) => o.kind === OptionKind.Size);
    if (!sizes.length) return [{ value: `${p.id}:`, productId: p.id, sizeName: null, label: p.name, price: p.price }];
    return sizes.map((o) => ({
      value: `${p.id}:${o.id}`,
      productId: p.id,
      sizeName: o.name,
      label: `${p.name}, ${o.name.toLocaleLowerCase("tr")}`,
      price: p.price + o.extraPrice,
    }));
  });
  return <NewOrderForm choices={choices} zones={zones} days={days} slots={slots} />;
}
