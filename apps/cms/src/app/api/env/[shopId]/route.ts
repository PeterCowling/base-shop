// apps/cms/src/app/api/env/[shopId]/route.ts
import { authOptions } from "@cms/auth/options";
import { getServerSession } from "next-auth";
import { NextResponse, type NextRequest } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";
import { resolveDataRoot } from "@platform-core/dataRoot";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ shopId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || !["admin", "ShopAdmin"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    const body = (await req.json()) as Record<string, string>;
    const { shopId } = await context.params;
    const dir = path.join(resolveDataRoot(), shopId);
    await fs.mkdir(dir, { recursive: true });
    const lines = Object.entries(body)
      .map(([k, v]) => `${k}=${String(v)}`)
      .join("\n");
    await fs.writeFile(path.join(dir, ".env"), lines, "utf8");
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 400 }
    );
  }
}
