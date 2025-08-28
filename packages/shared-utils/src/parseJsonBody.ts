import { NextResponse } from "next/server";
import { ZodSchema } from "zod";

export type ParseJsonResult<T> =
  | { success: true; data: T }
  | { success: false; response: NextResponse };

function parseLimit(limit: string | number): number {
  if (typeof limit === "number") return limit;
  const match = /^(\d+)(b|kb|mb|gb)$/i.exec(limit.trim());
  if (!match) {
    throw new Error("Invalid limit");
  }
  const [, num, unit] = match;
  const sizes: Record<string, number> = {
    b: 1,
    kb: 1024,
    mb: 1024 * 1024,
    gb: 1024 * 1024 * 1024,
  };
  return Number(num) * sizes[unit.toLowerCase()];
}

export async function parseJsonBody<T>(
  req: Request,
  schema: ZodSchema<T>,
  limit: string | number,
): Promise<ParseJsonResult<T>> {
  let json: unknown;
  try {
    const text = await req.text();
    const byteLength = new TextEncoder().encode(text).length;
    if (byteLength > parseLimit(limit)) {
      return {
        success: false,
        response: NextResponse.json(
          { error: "Payload Too Large" },
          { status: 413 },
        ),
      };
    }
    json = JSON.parse(text);
  } catch (err: unknown) {
    console.error(err instanceof Error ? err : "Unknown error");
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
      response: NextResponse.json(parsed.error.flatten().fieldErrors, {
        status: 400,
      }),
    };
  }
  return { success: true, data: parsed.data };
}

