import { NextResponse, type NextRequest } from "next/server";
import { authorize } from "../../../services/shops/authorization";
import { fetchShop, persistShop } from "../../../services/shops/persistence";
import { buildThemeData } from "../../../services/shops/theme";
import type { Shop } from "@acme/types";
import { z } from "zod";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ shop: string }> }
) {
  try {
    await authorize();
    const body = await req.json();
    const schema = z
      .object({
        themeOverrides: z
          .record(z.union([z.string(), z.null()]))
          .optional()
          .default({}),
        themeDefaults: z.record(z.string()).optional().default({}),
      })
      .partial();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      const message = parsed.error.issues.map((i) => i.message).join(", ");
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const { shop } = await context.params;
    const current = await fetchShop(shop);
    const theme = await buildThemeData(
      shop,
      { ...parsed.data, themeId: current.themeId } as any,
      current as Shop
    );
    await persistShop(shop, {
      id: current.id,
      themeDefaults: theme.themeDefaults,
      themeOverrides: theme.overrides,
      themeTokens: theme.themeTokens,
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 400 }
    );
  }
}
