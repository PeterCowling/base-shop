import { NextResponse, type NextRequest } from "next/server";
import { patchTheme } from "@cms/services/shops/themeService";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ shop: string }> },
) {
  try {
    const body = await req.json();
    const { shop } = await context.params;
    const { themeOverrides = {}, themeDefaults = {} } = body ?? {};
    const result = await patchTheme(shop, {
      themeOverrides,
      themeDefaults,
    });
    return NextResponse.json({ shop: result.shop });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 400 },
    );
  }
}
