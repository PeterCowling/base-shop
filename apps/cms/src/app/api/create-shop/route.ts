import { createNewShop } from "@cms/actions/createShop";
import { authOptions } from "@cms/auth/options";
import type { CreateShopOptions } from "@platform-core/createShop";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !["admin", "ShopAdmin"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { id, options } = body as { id: string; options?: CreateShopOptions };
    await createNewShop(id, options ?? {});
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 400 }
    );
  }
}
