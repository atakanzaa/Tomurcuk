import { NextResponse, type NextRequest } from "next/server";
import { completePayment, findShop } from "@/lib/api";
import { ShopLookupKind } from "@/lib/api/types";
import { clearDraftId } from "@/lib/checkout/session";
import { CheckoutStep, checkoutPath, PAYMENT_FAILED_PARAM, shopPath, trackingOrderPath } from "@/lib/routes";

// Ödeme sağlayıcısının alıcıyı geri gönderdiği adres (api: tomurcuk.web-url + /{slug}/siparis/odeme/sonuc).
// iyzico token'ı form olarak POST eder; geliştirmedeki sahte sağlayıcı GET ile gelir. Sonuç
// token'la backend'den sorulur; adresteki bilgiye güvenilmez.

async function handle(slug: string, token: string | null) {
  // Göreli adres: Traefik'in arkasında request.url container'ın iç adresini (0.0.0.0:3000) taşır.
  const to = (pathname: string) => new NextResponse(null, { status: 303, headers: { Location: pathname } });
  const lookup = await findShop(slug);
  if (lookup.kind !== ShopLookupKind.Found) return to(shopPath(slug));
  const failed = `${checkoutPath(slug, CheckoutStep.Payment)}?${PAYMENT_FAILED_PARAM}=1`;
  if (!token) return to(failed);

  const result = await completePayment(lookup.shop.id, token);
  if (!result?.paid) return to(failed);
  await clearDraftId(slug);
  return to(trackingOrderPath(slug, result.trackingToken));
}

export async function GET(request: NextRequest, { params }: RouteContext<"/[slug]/siparis/odeme/sonuc">) {
  const { slug } = await params;
  return handle(slug, request.nextUrl.searchParams.get("token"));
}

export async function POST(request: NextRequest, { params }: RouteContext<"/[slug]/siparis/odeme/sonuc">) {
  const { slug } = await params;
  const form = await request.formData().catch(() => null);
  const token = form?.get("token");
  return handle(slug, typeof token === "string" ? token : null);
}
