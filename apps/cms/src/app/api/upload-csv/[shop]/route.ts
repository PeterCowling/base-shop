import { authOptions } from "@cms/auth/options";
import { getServerSession } from "next-auth";
import { NextResponse, type NextRequest } from "next/server";
import fsSync, { promises as fs } from "node:fs";
import path from "node:path";

function resolveDataRoot(): string {
  let dir = process.cwd();
  while (true) {
    const candidate = path.join(dir, "data", "shops");
    if (fsSync.existsSync(candidate)) return candidate;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return path.resolve(process.cwd(), "data", "shops");
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ shop: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || !["admin", "ShopAdmin"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    const data = await req.formData();
    const file = data.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Missing file" }, { status: 400 });
    }
    const buf = Buffer.from(await file.arrayBuffer());
    const { shop } = await context.params;
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
