import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";

import { syncInbox } from "@/lib/inbox/sync.server";

export const dynamic = "force-dynamic";

function resolveCronSecret(env: Record<string, string | undefined>): string | null {
  return env.INBOX_SYNC_SECRET ?? env.INBOX_RECOVERY_SECRET ?? null;
}

export async function POST(request: Request) {
  try {
    const { env } = await getCloudflareContext({ async: true });
    const cfEnv = env as Record<string, string | undefined>;

    const secret = resolveCronSecret(cfEnv);
    if (!secret) {
      return NextResponse.json(
        { success: false, error: "Inbox cron secret not configured" },
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

    if (cfEnv.INBOX_AUTO_SYNC_ENABLED === "false") {
      return NextResponse.json({ success: true, enabled: false });
    }

    const result = await syncInbox({
      actorUid: "system:cron",
    });

    console.log("Inbox auto-sync completed", result);

    return NextResponse.json({
      success: true,
      enabled: true,
      result,
    });
  } catch (error) {
    console.error("Inbox auto-sync failed", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}
