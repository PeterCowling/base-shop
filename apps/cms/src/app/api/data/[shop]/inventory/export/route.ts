import { authOptions } from "@cms/auth/options";
import { getServerSession } from "next-auth";
import { NextResponse, type NextRequest } from "next/server";
import { readInventory } from "@platform-core/repositories/inventory.server";
import { format as formatCsv } from "fast-csv";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ shop: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || !["admin", "ShopAdmin"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    const { shop } = await context.params;
    const items = await readInventory(shop);
    const format = new URL(req.url).searchParams.get("format");
    if (format === "csv") {
      const csv = await new Promise<string>((resolve, reject) => {
        const chunks: string[] = [];
        const stream = formatCsv({ headers: true });
        stream
          .on("error", reject)
          .on("data", (c) => chunks.push(c.toString()))
          .on("end", () => resolve(chunks.join("")));
        items.forEach((i) => stream.write(i));
        stream.end();
      });
      return new Response(csv, {
        headers: { "content-type": "text/csv" },
      });
    }
    return NextResponse.json(items);
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 400 }
    );
  }
}
