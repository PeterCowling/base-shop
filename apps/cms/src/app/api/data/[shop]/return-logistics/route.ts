import { type NextRequest,NextResponse } from "next/server";
import { ensureRole } from "@cms/actions/common/auth";

import { writeReturnLogistics } from "@acme/platform-core/repositories/returnLogistics.server";
import { returnLogisticsSchema } from "@acme/types";

export async function POST(
  req: NextRequest,
  _context: { params: Promise<{ shop: string }> }
) {
  try {
    await ensureRole(["admin", "ShopAdmin"]);
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
