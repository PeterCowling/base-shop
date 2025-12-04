// apps/cms/src/app/api/create-shop/route.ts
import "@acme/zod-utils/initZod";
import { createNewShop } from "@cms/actions/createShop.server";
import { shopConfigSchema, type ShopConfig } from "@acme/types";
import { NextResponse } from "next/server";
import { z } from "zod";

/**
 * POST /cms/api/create-shop
 *
 * Body: { id: string; ...ShopConfig }
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
    const parsed = shopConfigSchema
      .extend({ id: z.string() })
      .safeParse(body);

    if (!parsed.success) {
      const message = parsed.error.issues
        .map((i) => i.message)
        .join(", ");
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const { id, ...config } = parsed.data as { id: string } & ShopConfig;

    const deployment = await createNewShop(id, config);

    /* --------------------------------------------------------------
     *  Success → 201 Created
     * ------------------------------------------------------------ */
    return NextResponse.json({ success: true, deployment }, { status: 201 });
  } catch (err) {
    /* --------------------------------------------------------------
     *  Forbidden or bad request
     * ------------------------------------------------------------ */
    console.error("Failed to create shop", err);

    const message = (err as Error).message;
    const status = message === "Forbidden" ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
