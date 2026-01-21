import "@acme/zod-utils/initZod";

import { type NextRequest,NextResponse } from "next/server";
import { ensureRole } from "@cms/actions/common/auth";
import path from "path";
import { z } from "zod";

import { resolveDataRoot } from "@acme/platform-core/dataRoot";
import { parseJsonBody } from "@acme/lib/http/server";

import { writeJsonFile } from "@/lib/server/jsonIO";

const schema = z
  .object({
    payment: z.array(z.string()).default([]),
    billingProvider: z.string().optional(),
    shipping: z.array(z.string()).default([]),
  })
  .strict();

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ shop: string }> }
) {
  try {
    await ensureRole(["admin", "ShopAdmin"]);
    const parsed = await parseJsonBody(req, schema, "1mb");
    if (parsed.success === false) return parsed.response;
    const { shop } = await context.params;
    const dir = path.join(resolveDataRoot(), shop);
    await writeJsonFile(path.join(dir, "providers.json"), parsed.data);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 400 }
    );
  }
}
