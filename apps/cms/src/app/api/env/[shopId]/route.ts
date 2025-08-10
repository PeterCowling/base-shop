import { authOptions } from "@cms/auth/options";
import { envSchema } from "@acme/config";
import { getServerSession } from "next-auth";
import { NextResponse, type NextRequest } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ shopId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || !["admin", "ShopAdmin"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    const body = await req.json();
    const parsed = envSchema.partial().safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }
    const { shopId } = await context.params;
    const lines = Object.entries(parsed.data)
      .map(([k, v]) => `${k}=${String(v).replace(/\n/g, "\\n")}`)
      .join("\n");
    const file = path.join(process.cwd(), `.env.${shopId}`);
    await fs.appendFile(file, lines + "\n", { encoding: "utf8" });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 400 }
    );
  }
}
