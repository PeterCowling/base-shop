// apps/cms/src/app/api/create-shop/route.ts
import { createNewShop } from "@cms/actions/createShop.server";
import type { CreateShopOptions } from "@platform-core/createShop";
import { NextResponse } from "next/server";

/**
 * POST /cms/api/create-shop
 *
 * Body: { id: string; options?: CreateShopOptions }
 *
 * • Returns **201** and `{ success: true }` when an admin or ShopAdmin
 *   successfully creates a shop.
 * • Returns **403** when the caller lacks permission.
 * • Returns **400** with an error message on validation / runtime errors.
 */
export async function POST(req: Request) {
  /* ------------------------------------------------------------------
   *  Parse request and delegate to the server action
   * ---------------------------------------------------------------- */
  try {
    const body = await req.json();
    const { id, options } = body as {
      id: string;
      options?: CreateShopOptions;
    };

    await createNewShop(id, options ?? {});

    /* --------------------------------------------------------------
     *  Success → 201 Created
     * ------------------------------------------------------------ */
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err) {
    if ((err as Error).message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

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
