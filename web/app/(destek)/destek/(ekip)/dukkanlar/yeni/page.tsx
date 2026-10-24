import { CaretLeft } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { Suspense } from "react";
import { getPilotApplications, getSupportUser } from "@/lib/api";
import { Permission, supportCan } from "@/lib/permissions";
import support from "../../_components/support.module.css";
import { OpenShopForm } from "./OpenShopForm";

export const metadata: Metadata = { title: "Dükkân aç" };

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value) ?? "";

export default function OpenShopPage({ searchParams }: PageProps<"/destek/dukkanlar/yeni">) {
  return (
    <Suspense>
      <OpenShop searchParams={searchParams} />
    </Suspense>
  );
}

async function OpenShop({ searchParams }: Pick<PageProps<"/destek/dukkanlar/yeni">, "searchParams">) {
  const [query, user] = await Promise.all([searchParams, getSupportUser()]);
  const applicationId = first(query.basvuru);
  const application = applicationId ? ((await getPilotApplications()).find((a) => a.id === applicationId && !a.shopId) ?? null) : null;
  // Vitrin adresi bu ortamın adresidir (staging.tomurcuk.shop, tomurcuk.shop).
  const host = (await headers()).get("x-forwarded-host") ?? (await headers()).get("host") ?? "tomurcuk.shop";
  return (
    <>
      <Link href={application ? "/destek/basvurular" : "/destek/dukkanlar"} className={support.back}>
        <CaretLeft size={16} aria-hidden="true" />
        {application ? "Başvurular" : "Dükkânlar"}
      </Link>
      <div className={support.pageHead}>
        <h1 className={support.title}>Dükkân aç</h1>
        {application && <span className={support.muted}>{application.shopName} başvurusundan</span>}
      </div>
      {supportCan(user.role, Permission.ShopOnboard) ? (
        <OpenShopForm application={application} host={host} />
      ) : (
        <p className={support.muted}>Dükkânı platform sahibi ya da destek lideri açar.</p>
      )}
    </>
  );
}
