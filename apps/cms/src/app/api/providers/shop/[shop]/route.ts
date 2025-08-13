import { authOptions } from "@cms/auth/options";
import { getServerSession } from "next-auth";
import { NextResponse, type NextRequest } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";
import { resolveDataRoot } from "@platform-core/dataRoot";
import { z } from "zod";
import { parseJsonBody } from "@shared-utils";

const schema = z
  .object({
    payment: z.array(z.string()).default([]),
    shipping: z.array(z.string()).default([]),
  })
  .strict();

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ shop: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || !["admin", "ShopAdmin"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    const parsed = await parseJsonBody(req, schema);
    if (!parsed.success) return parsed.response;
    const { shop } = await context.params;
    const dir = path.join(resolveDataRoot(), shop);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(
      path.join(dir, "providers.json"),
      JSON.stringify(parsed.data, null, 2),
      "utf8"
    );
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 400 }
    );
  }
}
