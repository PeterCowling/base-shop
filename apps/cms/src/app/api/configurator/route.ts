import { createNewShop } from "@cms/actions/createShop.server";
import { createShopOptionsSchema } from "@platform-core/createShop";
import { validateShopEnv } from "@platform-core/configurator";
import { NextResponse } from "next/server";
import { z } from "zod";
import { parseJsonBody } from "@shared-utils";

/**
 * POST /cms/api/configurator
 * Body: { id: string; ...CreateShopOptions }
 * Creates a new shop and validates the generated .env file.
 */
export async function POST(req: Request) {
  const schema = createShopOptionsSchema.extend({ id: z.string() });
  const parsed = await parseJsonBody(req, schema);
  if (!parsed.success) return parsed.response;

  try {
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
