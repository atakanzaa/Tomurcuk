import { NextResponse, type NextRequest } from "next/server";
import { impl } from "@/lib/api/impl";
import { ShopLookupKind } from "@/lib/api/types";
import { isReservedSegment, LOGIN_PATH, PANEL_SESSION_COOKIE } from "@/lib/routes";

// Vitrin sayfası akışla (streaming) gönderildiği için yanıt başladıktan sonra durum
// kodu değişemez. Eski slug'ın kalıcı yönlendirmesi (301) ve olmayan dükkânın 404'ü
// bu yüzden render başlamadan burada verilir. Kontrol hızlı olmalı: gerçek API'de
// bu çağrı yalnızca slug çözen hafif bir uç noktaya gider.

/** Hiçbir rotayla eşleşmeyen adres; kök not-found sayfası 404 ile döner. */
const NOT_FOUND_PATH = "/_/dukkan-bulunamadi";

export async function proxy(request: NextRequest) {
  const [, slug, ...rest] = request.nextUrl.pathname.split("/");
  // Panel oturumu yoksa render başlamadan giriş sayfasına. Süresi dolmuş oturumu API'nin 401'i yakalar.
  if (slug === "panel" && !request.cookies.has(PANEL_SESSION_COOKIE)) {
    return NextResponse.redirect(new URL(LOGIN_PATH, request.url));
  }
  if (!slug || isReservedSegment(slug)) return NextResponse.next();

  const lookup = await impl.findShop(decodeURIComponent(slug));
  if (lookup.kind === ShopLookupKind.Moved) {
    const url = request.nextUrl.clone();
    url.pathname = ["", lookup.slug, ...rest].join("/");
    return NextResponse.redirect(url, 301);
  }
  if (lookup.kind === ShopLookupKind.Missing) {
    return NextResponse.rewrite(new URL(NOT_FOUND_PATH, request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: "/:slug/:path*",
};
