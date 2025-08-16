// apps/cms/src/app/api/env/[shopId]/route.ts
import "@acme/lib/initZod";
import { NextResponse, type NextRequest } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { resolveDataRoot } from "@platform-core/dataRoot";
import { setupSanityBlog } from "@cms/actions/setupSanityBlog";
import { parseJsonBody } from "@shared-utils";
import { validateShopName } from "@acme/lib";

const schema = z.record(z.string(), z.string());

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ shopId: string }> }
) {
  const authHeader = req.headers.get("authorization") || "";
  const match = authHeader.match(/^Bearer (.+)$/i);
  if (!match) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    jwt.verify(match[1], process.env.JWT_SECRET || "");
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const parsed = await parseJsonBody(req, schema, "1mb");
    if ("response" in parsed) {
      return parsed.response;
    }
    const data = parsed.data;
    const { shopId } = await context.params;
    let safeShopId: string;
    try {
      safeShopId = validateShopName(shopId);
    } catch {
      return NextResponse.json({ error: "Invalid shop ID" }, { status: 400 });
    }
    const dir = path.join(resolveDataRoot(), safeShopId);
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
