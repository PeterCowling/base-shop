import { type NextRequest, NextResponse } from "next/server";

import { reconcileStaleCheckoutAttempts } from "@/lib/checkoutReconciliation.server";

export const runtime = "nodejs";

const SHOP = "caryina";

type ParsePositiveIntResult =
  | { ok: true; value?: number }
  | { ok: false; message: string };

function parsePositiveIntParam(
  raw: string | null,
  paramName: string,
): ParsePositiveIntResult {
  if (raw === null) {
    return { ok: true };
  }
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || !Number.isInteger(parsed) || parsed < 1) {
    return {
      ok: false,
      message: `${paramName} must be a positive integer`,
    };
  }
  return { ok: true, value: parsed };
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const authHeader = req.headers.get("authorization");
  const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;
  if (!process.env.CRON_SECRET || authHeader !== expectedAuth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); // i18n-exempt -- machine-readable API error
  }

  let body: Record<string, unknown> = {};
  try {
    const text = await req.text();
    if (text) body = JSON.parse(text) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }); // i18n-exempt -- machine-readable API error
  }

  const staleMinutesRaw =
    body.staleMinutes !== undefined ? String(body.staleMinutes) : null;
  const maxAttemptsRaw =
    body.maxAttempts !== undefined ? String(body.maxAttempts) : null;

  const staleMinutesParsed = parsePositiveIntParam(staleMinutesRaw, "staleMinutes");
  if (!staleMinutesParsed.ok) {
    return NextResponse.json({ error: staleMinutesParsed.message }, { status: 400 });
  }
  const maxAttemptsParsed = parsePositiveIntParam(maxAttemptsRaw, "maxAttempts");
  if (!maxAttemptsParsed.ok) {
    return NextResponse.json({ error: maxAttemptsParsed.message }, { status: 400 });
  }

  const staleMinutes = staleMinutesRaw === null ? undefined : staleMinutesParsed.value;
  const maxAttempts = maxAttemptsRaw === null ? undefined : maxAttemptsParsed.value;

  try {
    const summary = await reconcileStaleCheckoutAttempts({
      shopId: SHOP,
      staleMinutes,
      maxAttempts,
    });
    return NextResponse.json({
      ok: true,
      shopId: SHOP,
      summary,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Checkout reconciliation cron failed", err); // i18n-exempt -- developer log
    return NextResponse.json(
      {
        error: "Internal server error", // i18n-exempt -- machine-readable API error
        message: err instanceof Error ? err.message : "Unknown error", // i18n-exempt -- machine-readable API error
      },
      { status: 500 },
    );
  }
}
