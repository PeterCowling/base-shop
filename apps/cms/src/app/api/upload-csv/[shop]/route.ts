import { authOptions } from "@cms/auth/options";
import { getServerSession } from "next-auth";
import { NextResponse, type NextRequest } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";
import { resolveDataRoot } from "@platform-core/dataRoot";
import { z } from "zod";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ shop: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || !["admin", "ShopAdmin"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    const paramsResult = z
      .object({ shop: z.string() })
      .safeParse(await context.params);
    if (!paramsResult.success) {
      return NextResponse.json({ error: "Invalid shop" }, { status: 400 });
    }

    const data = await req.formData();
    const fileResult = z.instanceof(File).safeParse(data.get("file"));
    if (!fileResult.success) {
      return NextResponse.json({ error: "Missing file" }, { status: 400 });
    }
    const buf = Buffer.from(await fileResult.data.arrayBuffer());
    const { shop } = paramsResult.data;
    const dir = path.join(resolveDataRoot(), shop);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, "products.csv"), buf);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 400 }
    );
  }
}
