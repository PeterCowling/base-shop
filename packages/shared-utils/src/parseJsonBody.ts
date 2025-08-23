import { NextResponse } from "next/server";
import { z, ZodSchema } from "zod";
import getRawBody from "raw-body";
import { Readable } from "stream";
import type { ReadableStream as NodeReadableStream } from "stream/web";

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

export async function parseJsonBody<T>(
  req: Request,
  schema: ZodSchema<T>,
  limit: string | number,
): Promise<ParseJsonResult<T>> {
  let text: string;
  try {
    if (!req.body) throw new Error("No body");
    const stream = Readable.fromWeb(req.body as unknown as NodeReadableStream);
    text = await getRawBody(stream, {
      limit,
      encoding: "utf8",
    });
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
      response: NextResponse.json({ error: "Invalid JSON" }, { status: 400 }),
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

