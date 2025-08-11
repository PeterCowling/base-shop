import { NextResponse } from "next/server";
import { z } from "zod";

export async function parseJsonBody<T>(
  req: Request,
  schema: z.ZodSchema<T>,
): Promise<{ success: true; data: T } | { success: false; response: NextResponse }> {
  try {
    const json = await req.json();
    const parsed = schema.safeParse(json);
    if (!parsed.success) {
      return {
        success: false,
        response: NextResponse.json(parsed.error.flatten().fieldErrors, {
          status: 400,
        }),
      };
    }
    return { success: true, data: parsed.data };
  } catch {
    return {
      success: false,
      response: NextResponse.json({ error: "Invalid JSON" }, { status: 400 }),
    };
  }
}
