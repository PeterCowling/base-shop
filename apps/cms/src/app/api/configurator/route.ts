import "@acme/zod-utils/initZod";

import { NextResponse } from "next/server";
import { createNewShop } from "@cms/actions/createShop.server";
import { z } from "zod";

import { validateShopEnv } from "@acme/platform-core/configurator";
import { type ShopConfig,shopConfigSchema } from "@acme/types";

/**
 * POST /cms/api/configurator
 * Body: { id: string; ...ShopConfig }
 * Creates a new shop and validates the generated .env file.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = shopConfigSchema
      .extend({ id: z.string() })
      .safeParse(body);

    if (!parsed.success) {
      const message = parsed.error.issues.map((i) => i.message).join(", ");
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const { id, ...config } = parsed.data as { id: string } & ShopConfig;
    const deployment = await createNewShop(id, config);

    let envError: string | undefined;
    try {
      validateShopEnv(id);
    } catch (err) {
      envError = (err as Error).message;
    }

    return NextResponse.json(
      { success: true, deployment, ...(envError ? { envError } : {}) },
      { status: 201 }
    );
  } catch (err) {
    console.error("Failed to configure shop", err);
    const message = (err as Error).message;
    const status = message === "Forbidden" ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
