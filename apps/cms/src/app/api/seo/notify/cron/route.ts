import { NextResponse } from "next/server";

import { listShops } from "@/lib/listShops";

import { sendNotificationForShop } from "../route";

const DAY_MS = 24 * 60 * 60 * 1000;

export async function POST() {
  const shops = await listShops();
  const results: Record<string, string> = {};

  for (const shop of shops) {
    const res = await sendNotificationForShop(shop, { cooldownMs: DAY_MS, force: true });
    results[shop] = `${res.status}${"message" in res ? `:${res.message}` : ""}`;
  }

  return NextResponse.json({ ok: true, results });
}

export const GET = POST;
