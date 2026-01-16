import "@acme/zod-utils/initZod";
import { ensureRole } from "@cms/actions/common/auth";
import { NextResponse, type NextRequest } from "next/server";
import path from "path";
import { resolveDataRoot } from "@platform-core/dataRoot";
import { z } from "zod";
import { parseJsonBody } from "@shared-utils";
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
