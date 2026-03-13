import { NextResponse } from "next/server";

import { inventoryLog } from "../../../../lib/auth/inventoryLog";
import {
  clearInventoryCookie,
  revokeAllInventorySessions,
} from "../../../../lib/auth/session";

export const runtime = "nodejs";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  clearInventoryCookie(response);

  // Best-effort session revocation — fail open so the cookie clear still works.
  try {
    await revokeAllInventorySessions();
    inventoryLog("info", "logout", {});
  } catch (err) {
    inventoryLog("warn", "logout_revocation_skipped", {
      message: "Session revocation failed (KV unavailable) — cookie cleared only",
      error: err instanceof Error ? err.message : String(err),
    });
  }

  return response;
}
