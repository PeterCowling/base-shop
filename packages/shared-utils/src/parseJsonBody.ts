import { NextResponse } from "next/server";
import { z } from "zod";
import getRawBody from "raw-body";
import { Readable } from "node:stream";

export type ParseJsonResult<T> =
  | { success: true; data: T }
  | { success: false; response: NextResponse };

export async function parseJsonBody<T>(
  req: Request,
  schema: z.ZodSchema<T>,
  limit: string | number,
): Promise<ParseJsonResult<T>> {
  let text: string;
  try {
    if (!req.body) throw new Error("No body");
    const stream = Readable.fromWeb(req.body as any);
    text = await getRawBody(stream, {
      limit,
      encoding: "utf8",
    });
  } catch (err: unknown) {
    if (
      err instanceof Error &&
      (err as { type?: string }).type === "entity.too.large"
    ) {
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
