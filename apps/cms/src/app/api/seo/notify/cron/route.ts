import { type NextRequest, NextResponse } from "next/server";

import { listShops } from "@/lib/listShops";

import { sendNotificationForShop } from "../route";

const DAY_MS = 24 * 60 * 60 * 1000;

export async function POST(req: NextRequest) {
  // Require CRON_SECRET for scheduled job protection
  const authHeader = req.headers.get("authorization");
  const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;
  if (!process.env.CRON_SECRET || authHeader !== expectedAuth) {
    console.error("[seo/notify/cron] Unauthorized cron request");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const shops = await listShops();
  const results: Record<string, string> = {};

  for (const shop of shops) {
    const res = await sendNotificationForShop(shop, { cooldownMs: DAY_MS, force: true });
    results[shop] = `${res.status}${"message" in res ? `:${res.message}` : ""}`;
  }

  return NextResponse.json({ ok: true, results });
}

export async function GET(req: NextRequest) {
  return POST(req);
}
