import { NextResponse } from "next/server";
import { z } from "zod";
import type { ZodTypeAny } from "zod";

export async function parseJsonBody<T extends ZodTypeAny>(
  req: Request,
  schema: T,
): Promise<{ data: z.infer<T> } | { error: NextResponse }> {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return {
      error: NextResponse.json({ error: "Invalid JSON" }, { status: 400 }),
    };
  }
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return {
      error: NextResponse.json(parsed.error.flatten().fieldErrors, {
        status: 400,
      }),
    };
  }
  return { data: parsed.data };
}
