// apps/cms/src/app/api/env/[shopId]/route.ts
import "@acme/zod-utils/initZod";

import { type NextRequest,NextResponse } from "next/server";
import { ensureRole } from "@cms/actions/common/auth";
import { setupSanityBlog } from "@cms/actions/setupSanityBlog";
import { promises as fs } from "fs";
import path from "path";
import { z } from "zod";

import { resolveDataRoot } from "@acme/platform-core/dataRoot";
import { validateShopName } from "@acme/platform-core/shops";
import { parseJsonBody } from "@acme/lib/http/server";

const schema = z.record(z.string(), z.string());

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ shopId: string }> }
) {
  try {
    await ensureRole(["admin", "ShopAdmin"]);
    const parsed = await parseJsonBody(req, schema, "1mb");
    if ("response" in parsed) {
      return parsed.response;
    }
    const data = parsed.data;
    const { shopId } = await context.params;
    const safeShop = validateShopName(shopId);
    const dir = path.join(resolveDataRoot(), safeShop);
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- SEC-101 Validated shopId and joined under data root
    await fs.mkdir(dir, { recursive: true });
    const lines = Object.entries(data ?? {})
      .map(([k, v]) => `${k}=${String(v)}`)
      .join("\n");
    const content = lines ?? "";
    if (process.env.NODE_ENV !== "test") {
      try {
        console.log("[env] write .env", { // i18n-exempt -- CMS-2134 [ttl=2026-03-31]
          shopId,
          file: path.join(dir, ".env"),
          bytes: Buffer.byteLength(content, "utf8"),
        });
      } catch {}
    }
    // The path is constrained to the workspace data directory; values are validated.
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- SEC-101 Validated shopId and joined under data root
    await fs.writeFile(path.join(dir, ".env"), content, "utf8");
    if (
      data.SANITY_PROJECT_ID &&
      data.SANITY_DATASET &&
      data.SANITY_TOKEN
    ) {
      await setupSanityBlog(
        {
          projectId: data.SANITY_PROJECT_ID,
          dataset: data.SANITY_DATASET,
          token: data.SANITY_TOKEN,
        },
        {
          enabled: data.ENABLE_EDITORIAL === "true",
          ...(data.PROMOTE_SCHEDULE
            ? { promoteSchedule: data.PROMOTE_SCHEDULE }
            : {}),
        },
      ).catch((err) => {
        console.error("[env] failed to setup Sanity blog", err); // i18n-exempt -- CMS-2134 [ttl=2026-03-31]
      });
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 400 },
    );
  }
}
