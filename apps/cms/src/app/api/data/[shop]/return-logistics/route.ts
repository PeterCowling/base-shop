import { authOptions } from "@cms/auth/options";
import { getServerSession } from "next-auth";
import { NextResponse, type NextRequest } from "next/server";
import { returnLogisticsSchema } from "@acme/types";
import { writeReturnLogistics } from "@platform-core/repositories/returnLogistics.server";

export async function POST(
  req: NextRequest,
  _context: { params: { shop: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || !["admin", "ShopAdmin"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    const body = await req.json();
    const parsed = returnLogisticsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().formErrors.join(", ") },
        { status: 400 }
      );
    }
    const {
      labelService,
      inStore,
      dropOffProvider,
      tracking,
      bagType,
      returnCarrier,
      homePickupZipCodes,
      mobileApp,
      requireTags,
      allowWear,
    } = parsed.data;
    await writeReturnLogistics({
      labelService,
      inStore,
      dropOffProvider,
      tracking,
      bagType,
      returnCarrier,
      homePickupZipCodes,
      mobileApp,
      requireTags,
      allowWear,
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 400 }
    );
  }
}
