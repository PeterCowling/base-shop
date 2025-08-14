import { authOptions } from "@cms/auth/options";
import { getServerSession } from "next-auth";
import { NextResponse, type NextRequest } from "next/server";
import { returnLogisticsSchema } from "@acme/types";
import { writeReturnLogistics } from "@platform-core/repositories/returnLogistics.server";

export async function POST(
  req: NextRequest,
  _context: { params: Promise<{ shop: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || !["admin", "ShopAdmin"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    const raw = await req.json();
    const body = {
      ...raw,
      dropOffProvider: raw.dropOffProvider || undefined,
      tracking:
        typeof raw.tracking === "boolean" ? raw.tracking : undefined,
    };
    const parsed = returnLogisticsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().formErrors.join(", ") },
        { status: 400 }
      );
    }
    await writeReturnLogistics(parsed.data);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 400 }
    );
  }
}
