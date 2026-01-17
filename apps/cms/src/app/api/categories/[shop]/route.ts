import { authOptions } from "@cms/auth/options";
import { getServerSession } from "next-auth";
import { NextResponse, type NextRequest } from "next/server";
import path from "path";
import { resolveDataRoot } from "@acme/platform-core/dataRoot";
import { writeJsonFile } from "@/lib/server/jsonIO";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ shop: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || !["admin", "ShopAdmin"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
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
