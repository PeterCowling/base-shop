import { NextResponse } from "next/server";
import { z } from "zod";

export type ParseJsonResult<T> =
  | { success: true; data: T }
  | { success: false; response: NextResponse };

export async function parseJsonBody<T>(
  req: Request,
  schema: z.ZodSchema<T>,
): Promise<ParseJsonResult<T>> {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return {
      success: false,
      response: NextResponse.json(
        { error: "Invalid JSON" },
        { status: 400 },
      ),
    };
  }
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return {
      success: false,
      response: NextResponse.json(
        parsed.error.flatten().fieldErrors,
        { status: 400 },
      ),
    };
  }
  return { success: true, data: parsed.data };
}
