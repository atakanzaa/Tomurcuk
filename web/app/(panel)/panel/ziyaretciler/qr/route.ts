import QRCode from "qrcode";
import { Channel } from "@/lib/api/types";
import { shareLink } from "@/lib/channel";
import { loadPanel } from "@/lib/panel/session";
import { siteUrl } from "@/lib/share";

/** Tabela ve kartvizit için QR kod (PNG, 1024 piksel); vitrini `?k=qr` ile açar. */
export async function GET() {
  const { shop } = await loadPanel();
  const png = await QRCode.toBuffer(shareLink(siteUrl(), shop.slug, Channel.Qr), {
    type: "png",
    width: 1024,
    margin: 2,
    errorCorrectionLevel: "M",
  });
  return new Response(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": `attachment; filename="${shop.slug}-qr.png"`,
      "Cache-Control": "private, no-store",
    },
  });
}
