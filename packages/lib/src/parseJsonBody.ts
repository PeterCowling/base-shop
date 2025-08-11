import { NextResponse } from "next/server";
import type { z } from "zod";

/**
 * Parse and validate a JSON request body using the provided Zod schema.
 * Returns a standardized error response on failure.
 */
export async function parseJsonBody<T extends z.ZodTypeAny>(
  req: Request,
  schema: T,
): Promise<
  | { success: true; data: z.infer<T> }
  | { success: false; error: NextResponse }
> {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return {
      success: false,
      error: NextResponse.json({ error: "Invalid JSON" }, { status: 400 }),
    };
  }

  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return {
      success: false,
      error: NextResponse.json(parsed.error.flatten().fieldErrors, {
        status: 400,
      }),
    };
  }

  return { success: true, data: parsed.data };
}
