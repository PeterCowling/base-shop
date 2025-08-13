import { NextRequest } from "next/server";
import { onOpen } from "@acme/email";
import { emitOpen } from "@acme/email/hooks";
import { trackEvent } from "@platform-core/analytics";

// 1x1 transparent gif
const pixel = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==",
  "base64"
);

onOpen(({ shop, campaign }) =>
  trackEvent(shop, { type: "email_open", campaign })
);

export async function GET(req: NextRequest) {
  const shop = req.nextUrl.searchParams.get("shop");
  const campaign = req.nextUrl.searchParams.get("campaign");
  if (shop && campaign) {
    await emitOpen({ shop, campaign });
  }
  return new Response(pixel, {
    headers: {
      "Content-Type": "image/gif",
      "Cache-Control": "no-store, max-age=0",
    },
  });
}
