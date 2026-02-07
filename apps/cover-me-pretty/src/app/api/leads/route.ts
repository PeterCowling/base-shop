// apps/cover-me-pretty/src/app/api/leads/route.ts
import { promises as fs } from "node:fs";
import path from "node:path";

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";

import { resolveDataRoot } from "@acme/platform-core/dataRoot";
import { getShopSettings } from "@acme/platform-core/repositories/shops.server";
import { validateShopName } from "@acme/platform-core/shops";
import { safeWebhookFetch } from "@acme/platform-core/utils";

import shop from "../../../../shop.json";

export const runtime = "nodejs";

const Body = z.object({
  type: z.enum(["newsletter", "contact"]),
  email: z.string().email(),
  name: z.string().optional(),
  message: z.string().max(4000).optional(),
  locale: z.string().optional(),
  source: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid lead payload" }, { status: 400 }); // i18n-exempt -- SHOP-3204 machine-readable API error [ttl=2026-06-30]
  }

  // Gate by shop settings if present
  let settings: Awaited<ReturnType<typeof getShopSettings>> | undefined;
  try {
    settings = await getShopSettings(shop.id);
    if (settings.leadCapture?.enabled === false) {
      return NextResponse.json({ ok: true, skipped: "lead-capture-disabled" }, { status: 202 }); // i18n-exempt -- SHOP-3204 machine-readable skip flag [ttl=2026-06-30]
    }
  } catch {
    // allow if settings unavailable
  }

  const payload = parsed.data;
  const url = new URL(req.url);
  const entry = {
    ...payload,
    shop: shop.id,
    timestamp: new Date().toISOString(),
    ip: req.headers.get("x-forwarded-for")?.split(",")[0] ?? "",
    referer: req.headers.get("referer") ?? "",
    utm_source: url.searchParams.get("utm_source") ?? undefined,
    utm_medium: url.searchParams.get("utm_medium") ?? undefined,
    utm_campaign: url.searchParams.get("utm_campaign") ?? undefined,
    consent: req.cookies.get("consent.analytics")?.value,
  };

  const base = resolveDataRoot();
  const dir = path.join(base, validateShopName(shop.id));
  const file = path.join(dir, "leads.jsonl");

  // Persist lead locally; safe to no-op if storage fails.
  try {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- SHOP-3204 path uses validated shop and resolveDataRoot [ttl=2026-06-30]
    await fs.mkdir(dir, { recursive: true });
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- SHOP-3204 append stays under validated data root [ttl=2026-06-30]
    await fs.appendFile(file, JSON.stringify(entry) + "\n", "utf8");
  } catch {
    /* swallow storage failures so UX is unaffected */
  }

  // Optional forwarder (e.g., ESP/CRM webhook) with SSRF protection
  const endpoint = settings?.leadCapture?.endpoint;
  if (endpoint) {
    const result = await safeWebhookFetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(entry),
      timeout: 5000,
      retries: 2,
    });

    if (!result.ok) {
      try {
        // eslint-disable-next-line security/detect-non-literal-fs-filename -- SHOP-3204 log path uses validated shop + resolveDataRoot [ttl=2026-06-30]
        await fs.appendFile(
          path.join(dir, "lead-webhook-errors.log"),
          JSON.stringify({
            endpoint,
            error:
              result.error ??
              /* i18n-exempt -- ABC-123 ttl=2026-03-31 */ "Unknown error",
            attempts: result.attempts,
            entry,
            ts: new Date().toISOString(),
          }) + "\n",
          "utf8",
        );
      } catch {
        /* ignore logging failure */
      }
    }
  }

  return NextResponse.json({ ok: true });
}
