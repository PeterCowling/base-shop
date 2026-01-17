import { NextResponse, type NextRequest } from "next/server";
import { patchTheme } from "@cms/services/shops";
import { readShop } from "@acme/platform-core/repositories/shops.server";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ shop: string }> },
) {
  try {
    const body = await req.json();
    const { shop } = await context.params;
    const { themeOverrides, themeDefaults, themeId } = body ?? {};
    const result = await patchTheme(shop, {
      themeOverrides,
      themeDefaults,
      themeId,
    });
    return NextResponse.json({ shop: result.shop });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 400 },
    );
  }
}

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ shop: string }> },
) {
  try {
    const { shop } = await context.params;
    const s = await readShop(shop);
    return NextResponse.json({
      themeId: s.themeId,
      themeDefaults: s.themeDefaults ?? {},
      themeOverrides: s.themeOverrides ?? {},
      themeTokens: s.themeTokens ?? {},
    });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 400 },
    );
  }
}
