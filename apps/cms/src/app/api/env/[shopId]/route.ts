// apps/cms/src/app/api/env/[shopId]/route.ts
import { authOptions } from "@cms/auth/options";
import { getServerSession } from "next-auth";
import { NextResponse, type NextRequest } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";
import { z } from "zod";
import { resolveDataRoot } from "@platform-core/dataRoot";
import { setupSanityBlog } from "@cms/actions/setupSanityBlog";
import "@acme/lib/initZod";

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
    const body = schema.safeParse(await req.json());
    if (!body.success) {
      return NextResponse.json(
        { error: body.error.message },
        { status: 400 }
      );
    }
    const { shopId } = await context.params;
    const dir = path.join(resolveDataRoot(), shopId);
    await fs.mkdir(dir, { recursive: true });
    const lines = Object.entries(body.data)
      .map(([k, v]) => `${k}=${String(v)}`)
      .join("\n");
    await fs.writeFile(path.join(dir, ".env"), lines, "utf8");
    if (
      body.data.SANITY_PROJECT_ID &&
      body.data.SANITY_DATASET &&
      body.data.SANITY_TOKEN
    ) {
      await setupSanityBlog({
        projectId: body.data.SANITY_PROJECT_ID,
        dataset: body.data.SANITY_DATASET,
        token: body.data.SANITY_TOKEN,
      }).catch((err) => {
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
