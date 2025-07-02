import { authOptions } from "@cms/auth/options";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
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
  req: Request,
  { params }: { params: { shop: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || !["admin", "ShopAdmin"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    const body = (await req.json()) as {
      payment?: string[];
      shipping?: string[];
    };
    const dir = path.join(resolveDataRoot(), params.shop);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(
      path.join(dir, "providers.json"),
      JSON.stringify(
        {
          payment: Array.isArray(body.payment) ? body.payment : [],
          shipping: Array.isArray(body.shipping) ? body.shipping : [],
        },
        null,
        2
      ),
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
