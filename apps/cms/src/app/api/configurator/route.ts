import { createNewShop } from "@cms/actions/createShop.server";
import { createShopOptionsSchema } from "@platform-core/createShop";
import { validateShopEnv } from "@platform-core/configurator";
import { NextResponse } from "next/server";
import { z } from "zod";
import "@acme/lib/initZod";

/**
 * POST /cms/api/configurator
 * Body: { id: string; ...CreateShopOptions }
 * Creates a new shop and validates the generated .env file.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = createShopOptionsSchema
      .extend({ id: z.string() })
      .safeParse(body);

    if (!parsed.success) {
      const message = parsed.error.issues.map((i) => i.message).join(", ");
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const { id, ...options } = parsed.data;
    const deployment = await createNewShop(id, options);

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
