import { NextRequest } from "next/server";
import { trackEvent } from "@platform-core/analytics";

// 1x1 transparent gif
const pixel = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==",
  "base64"
);

export async function GET(req: NextRequest) {
  req.nextUrl.searchParams.delete("t");
  const shop = req.nextUrl.searchParams.get("shop");
  const campaign = req.nextUrl.searchParams.get("campaign");
  if (shop && campaign) {
    await trackEvent(shop, { type: "email_open", campaign });
  }
  return new Response(pixel, {
    headers: {
      "Content-Type": "image/gif",
      "Cache-Control": "no-store, max-age=0",
    },
  });
}
