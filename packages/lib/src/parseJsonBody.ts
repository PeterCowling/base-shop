import { NextResponse } from "next/server";
import type { z } from "zod";

export async function parseJsonBody<T>(
  req: Request,
  schema: z.ZodSchema<T>,
): Promise<{ success: true; data: T } | { success: false; error: NextResponse }> {
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
