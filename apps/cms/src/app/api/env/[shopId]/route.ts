// apps/cms/src/app/api/env/[shopId]/route.ts
import "@acme/zod-utils/initZod";
import { authOptions } from "@cms/auth/options";
import { getServerSession } from "next-auth";
import { NextResponse, type NextRequest } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";
import { z } from "zod";
import { resolveDataRoot } from "@platform-core/dataRoot";
import { setupSanityBlog } from "@cms/actions/setupSanityBlog";
import { parseJsonBody } from "@shared-utils";

const schema = z.record(z.string(), z.string());

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ shopId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || !["admin", "ShopAdmin"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    const parsed = await parseJsonBody(req, schema, "1mb");
    if ("response" in parsed) {
      return parsed.response;
    }
    const data = parsed.data;
    const { shopId } = await context.params;
    const dir = path.join(resolveDataRoot(), shopId);
    await fs.mkdir(dir, { recursive: true });
    const lines = Object.entries(data)
      .map(([k, v]) => `${k}=${String(v)}`)
      .join("\n");
    await fs.writeFile(path.join(dir, ".env"), lines, "utf8");
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
        console.error("[env] failed to setup Sanity blog", err);
      });
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 400 }
    );
  }
}
