import { ensureRole } from "@cms/actions/common/auth";
import { NextResponse, type NextRequest } from "next/server";
import path from "path";
import { resolveDataRoot } from "@platform-core/dataRoot";
import { writeJsonFile } from "@/lib/server/jsonIO";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ shop: string }> }
) {
  try {
    await ensureRole(["admin", "ShopAdmin"]);
    const categories = await req.json();
    const { shop } = await context.params;
    const dir = path.join(resolveDataRoot(), shop);
    await writeJsonFile(path.join(dir, "categories.json"), categories);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 400 }
    );
  }
}
