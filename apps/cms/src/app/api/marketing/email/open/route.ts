import { NextRequest } from "next/server";
import { emitOpen } from "@acme/email";

// 1x1 transparent gif
const pixel = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==",
  "base64"
);

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  params.delete("t");
  const shop = params.get("shop");
  const campaign = params.get("campaign");
  if (shop && campaign) {
    await emitOpen(shop, { campaign });
  }
  return new Response(pixel, {
    headers: {
      "Content-Type": "image/gif",
      "Cache-Control": "no-store, max-age=0",
    },
  });
}
