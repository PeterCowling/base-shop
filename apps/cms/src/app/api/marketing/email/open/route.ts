import { type NextRequest } from "next/server";

export const runtime = "nodejs";

// 1x1 transparent gif
const pixel = Uint8Array.from(
  atob("R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw=="),
  (c) => c.charCodeAt(0)
);

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  params.delete("t");
  const shop = params.get("shop");
  const campaign = params.get("campaign");
  if (shop && campaign) {
    const { emitOpen } = await import("@acme/email");
    await emitOpen(shop, { campaign });
  }
  return new Response(pixel, {
    headers: {
      "Content-Type": "image/gif",
      "Cache-Control": "no-store, max-age=0",
    },
  });
}
