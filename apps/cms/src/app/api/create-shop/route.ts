// apps/cms/src/app/api/create-shop/route.ts
import { createNewShop } from "@cms/actions/createShop.server";
import { authOptions } from "@cms/auth/options";
import { createShopOptionsSchema } from "@platform-core/createShop";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";

/**
 * POST /cms/api/create-shop
 *
 * Body: { id: string; ...CreateShopOptions }
 *
 * • Returns **201** and `{ success: true }` when an admin or ShopAdmin
 *   successfully creates a shop.
 * • Returns **403** when the caller lacks permission.
 * • Returns **400** with an error message on validation / runtime errors.
 */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  /* ------------------------------------------------------------------
   *  Only admins and existing ShopAdmins may create new shops
   * ---------------------------------------------------------------- */
  if (!session || !["admin", "ShopAdmin"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  /* ------------------------------------------------------------------
   *  Parse request and delegate to the server action
   * ---------------------------------------------------------------- */
  try {
    const body = await req.json();
    const parsed = createShopOptionsSchema
      .extend({ id: z.string() })
      .safeParse(body);

    if (!parsed.success) {
      const message = parsed.error.issues
        .map((i) => i.message)
        .join(", ");
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const { id, ...options } = parsed.data;

    const deployment = await createNewShop(id, options);

    /* --------------------------------------------------------------
     *  Success → 201 Created
     * ------------------------------------------------------------ */
    return NextResponse.json({ success: true, deployment }, { status: 201 });
  } catch (err) {
    /* --------------------------------------------------------------
     *  Bad request or runtime failure → 400
     * ------------------------------------------------------------ */
    console.error("Failed to create shop", err);

    return NextResponse.json(
      { error: (err as Error).message },
      { status: 400 }
    );
  }
}
