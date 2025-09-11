import { z } from "zod";

export async function fetchJson<T>(
  input: RequestInfo | URL,
  init?: RequestInit,
  schema?: z.ZodType<T>
): Promise<T> {
  const res = await fetch(input, init);

  if (res.ok) {
    let data: unknown;
    try {
      if (typeof (res as any).json === "function") {
        data = await (res as any).json();
      } else {
        const text = await res.text();
        data = text ? JSON.parse(text) : undefined;
      }
    } catch {
      data = undefined;
    }
    return schema ? schema.parse(data) : (data as T);
  }

  const text = await res.text().catch(() => "");
  let message: string | undefined;
  let parsed: unknown;
  let isJson = false;
  try {
    parsed = text ? JSON.parse(text) : undefined;
    isJson = true;
  } catch {
    parsed = undefined;
  }
  const error = z.object({ error: z.string() }).safeParse(parsed);
  if (error.success) {
    message = error.data.error;
  } else if (res.statusText) {
    message = res.statusText;
  } else if (!isJson && text) {
    message = text;
  } else {
    message = `HTTP ${res.status}`;
  }
  throw new Error(message);
}
