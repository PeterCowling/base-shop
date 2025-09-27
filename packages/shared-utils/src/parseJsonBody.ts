import { NextResponse } from "next/server";
import { ZodSchema } from "zod";

export type ParseJsonResult<T> =
  | { success: true; data: T }
  | { success: false; response: NextResponse };

export function parseLimit(limit: string | number): number {
  if (typeof limit === "number") return limit;
  const match = /^(\d+)(b|kb|mb|gb)$/i.exec(limit.trim());
  if (!match) {
    // i18n-exempt: developer-facing validation message
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
  const contentType = req.headers?.get?.("content-type") ?? "";
  if (contentType) {
    const [type, ...params] = contentType
      .split(";")
      .map((p) => p.trim().toLowerCase());
    const isJson = type === "application/json";
    const invalidParams = params.some((p) => !p.startsWith("charset="));
    if (!isJson || invalidParams) {
      const request = req as Request & { text?: () => Promise<string> };
      if (typeof request.text === "function") {
        try {
          await request.text();
        } catch {
          // ignore errors while draining the body
        }
      }
      return {
        success: false,
        response: NextResponse.json(
          // i18n-exempt: API error code; not UI copy
          { error: "Invalid JSON" },
          { status: 400 },
        ),
      };
    }
  }

  let json: unknown;
  try {
    const request = req as Request & {
      text?: () => Promise<string>;
      json?: () => Promise<unknown>;
    };
    if (typeof request.text === "function") {
      const text = await request.text();
      const byteLength = new TextEncoder().encode(text).length;
      if (byteLength > parseLimit(limit)) {
        return {
          success: false,
          response: NextResponse.json(
            // i18n-exempt: API error code; not UI copy
            { error: "Payload Too Large" },
            { status: 413 },
          ),
        };
      }
      json = JSON.parse(text);
    } else if (typeof request.json === "function") {
      json = await request.json();
      const text = JSON.stringify(json);
      const byteLength = new TextEncoder().encode(text).length;
      if (byteLength > parseLimit(limit)) {
        return {
          success: false,
          response: NextResponse.json(
            // i18n-exempt: API error code; not UI copy
            { error: "Payload Too Large" },
            { status: 413 },
          ),
        };
      }
    } else {
      // i18n-exempt: developer/infra diagnostic message
      throw new Error("No body parser available");
    }
  } catch {
    return {
      success: false,
      response: NextResponse.json(
        // i18n-exempt: API error code; not UI copy
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
