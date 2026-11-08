"use client";

import { useEffect } from "react";
import { useParams, usePathname } from "next/navigation";
import { CHANNEL_PARAM, arrivalChannel, claimVisit } from "@/lib/channel";
import { recordVisitAction } from "@/lib/visit-actions";

/**
 * Vitrine ilk gelişte kanalı bulur ve ziyareti oturumda bir kez sayar. Yalnızca vitrin ve ürün
 * sayfaları sayılır; sipariş adımları, takip ve sözleşmeler (SMS'teki bağlantı, ödeme dönüşü)
 * ziyaret değildir. Paylaşım parametresi adresten silinir, bağlantıyı kopyalayan başkası
 * Instagram'dan gelmiş sayılmasın.
 */
export function VisitTracker() {
  const { slug } = useParams<{ slug: string }>();
  const pathname = usePathname();

  useEffect(() => {
    const showcase = pathname === `/${slug}` || pathname.startsWith(`/${slug}/urun/`);
    if (!showcase) return;
    const channel = arrivalChannel(slug);
    const url = new URL(window.location.href);
    if (url.searchParams.has(CHANNEL_PARAM)) {
      url.searchParams.delete(CHANNEL_PARAM);
      window.history.replaceState(window.history.state, "", url.pathname + url.search + url.hash);
    }
    if (claimVisit(slug)) void recordVisitAction(slug, channel);
  }, [slug, pathname]);

  return null;
}
