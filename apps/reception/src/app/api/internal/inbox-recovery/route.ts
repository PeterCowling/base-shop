import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";

import { getInboxDb } from "@/lib/inbox/db.server";
import { recoverStaleThreads } from "@/lib/inbox/recovery.server";

const DEFAULT_STALE_HOURS = 2;

export const dynamic = "force-dynamic";

function parseEnvNumber(value: string | undefined, fallback: number): number {
  if (!value) {
    return fallback;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export async function POST(request: Request) {
  try {
    const { env } = await getCloudflareContext({ async: true });
    const cfEnv = env as Record<string, string | undefined>;

    // Auth gate: require INBOX_RECOVERY_SECRET
    const secret = cfEnv.INBOX_RECOVERY_SECRET;
    if (!secret) {
      return NextResponse.json(
        { success: false, error: "INBOX_RECOVERY_SECRET not configured" },
        { status: 503 },
      );
    }

    const authHeader = request.headers.get("Authorization");
    const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!bearerToken || bearerToken !== secret) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    // Check if recovery is enabled
    const enabled = cfEnv.INBOX_RECOVERY_ENABLED;
    if (enabled === "false") {
      return NextResponse.json({ success: true, enabled: false });
    }

    // Run recovery
    const staleHours = parseEnvNumber(cfEnv.INBOX_RECOVERY_STALE_HOURS, DEFAULT_STALE_HOURS);
    const staleThresholdMs = staleHours * 60 * 60 * 1000;
    const db = getInboxDb();

    const result = await recoverStaleThreads({
      db,
      staleThresholdMs,
    });

    console.log("Inbox recovery completed", result);

    return NextResponse.json({
      success: true,
      enabled: true,
      ...result,
    });
  } catch (error) {
    console.error("Inbox recovery failed", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}
