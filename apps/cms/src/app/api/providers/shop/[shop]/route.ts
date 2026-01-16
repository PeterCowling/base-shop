import "@acme/zod-utils/initZod";
import { authOptions } from "@cms/auth/options";
import { getServerSession } from "next-auth";
import { NextResponse, type NextRequest } from "next/server";
import path from "path";
import { resolveDataRoot } from "@acme/platform-core/dataRoot";
import { z } from "zod";
import { parseJsonBody } from "@acme/shared-utils";
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
  const session = await getServerSession(authOptions);
  if (!session || !["admin", "ShopAdmin"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
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
