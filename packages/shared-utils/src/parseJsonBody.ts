import { NextResponse } from "next/server";
import { z } from "zod";

export type ParseJsonResult<T> =
  | { success: true; data: T }
  | { success: false; response: NextResponse };

function hasErrorType(err: unknown): err is { type: string } {
  return (
    typeof err === "object" &&
    err !== null &&
    typeof (err as { type?: unknown }).type === "string"
  );
}

function parseLimit(limit: string | number): number {
  if (typeof limit === "number") return limit;
  const match = /^([0-9]+)(b|kb|mb|gb)$/i.exec(limit);
  if (!match) throw new Error("Invalid limit");
  const value = Number(match[1]);
  const unit = match[2].toLowerCase();
  const multipliers = {
    b: 1,
    kb: 1024,
    mb: 1024 * 1024,
    gb: 1024 * 1024 * 1024,
  } as const;
  return value * multipliers[unit as keyof typeof multipliers];
}

export async function parseJsonBody<T>(
  req: Request,
  schema: z.ZodSchema<T>,
  limit: string | number,
): Promise<ParseJsonResult<T>> {
  let text: string;
  try {
    if (!req.body) throw new Error("No body");
    const buf = Buffer.from(await req.arrayBuffer());
    const max = parseLimit(limit);
    if (buf.length > max) {
      throw Object.assign(new Error("entity.too.large"), {
        type: "entity.too.large",
      });
    }
    text = buf.toString("utf8");
  } catch (err: unknown) {
    if (hasErrorType(err) && err.type === "entity.too.large") {
      return {
        success: false,
        response: NextResponse.json(
          { error: "Payload Too Large" },
          { status: 413 },
        ),
      };
    }
    console.error(err instanceof Error ? err : "Unknown error");
    return {
      success: false,
      response: NextResponse.json(
        { error: "Invalid JSON" },
        { status: 400 },
      ),
    };
  }
  let json: unknown;
  try {
    json = JSON.parse(text);
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
