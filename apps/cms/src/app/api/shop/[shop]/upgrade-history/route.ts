import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

import { requirePermission } from "@acme/auth";
import { resolveDataRoot } from "@acme/platform-core/dataRoot";
import { validateShopName } from "@acme/platform-core/shops";
import { logger } from "@acme/lib/logger";

export const runtime = "nodejs";

type HistoryEntry = {
  id: string;
  shopId: string;
  status: "success" | "failed";
  timestamp: string;
  components?: string[];
  user?: string;
  duration?: string;
  error?: string;
};

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ shop: string }> }
) {
  try {
    await requirePermission("manage_pages");
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { shop } = await params;

  try {
    const safe = validateShopName(shop);
    const file = path.join(resolveDataRoot(), safe, "upgrade-history.json");
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- OPS-3208 constrained by validateShopName + data root [ttl=2026-06-30]
    const content = await fs.readFile(file, "utf8");
    const parsed = JSON.parse(content) as unknown;
    const entries = Array.isArray(parsed)
      ? (parsed.map((item) => sanitizeEntry(item, safe)).filter(Boolean) as HistoryEntry[])
      : [];
    return NextResponse.json(entries);
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code === "ENOENT") {
      return NextResponse.json([]);
    }
    logger.error("[api/upgrade-history:GET] error", { shop, error: err });
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
}

function sanitizeEntry(entry: unknown, shopId: string): HistoryEntry | null {
  if (!entry || typeof entry !== "object") return null;
  const payload = entry as Record<string, unknown>;
  const id = typeof payload.id === "string" ? payload.id : `job-${Date.now()}`;
  const status =
    payload.status === "failed" ? "failed" : "success";
  const timestamp =
    typeof payload.timestamp === "string"
      ? payload.timestamp
      : new Date().toISOString();
  const components = Array.isArray(payload.components)
    ? payload.components.filter((c): c is string => typeof c === "string")
    : [];
  const user = typeof payload.user === "string" ? payload.user : undefined;
  const duration =
    typeof payload.duration === "string" ? payload.duration : undefined;
  const error =
    typeof payload.error === "string" ? payload.error : undefined;

  return {
    id,
    shopId,
    status,
    timestamp,
    components,
    user,
    duration,
    error,
  };
}
