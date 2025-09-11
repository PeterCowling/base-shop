import { z } from "zod";

export async function fetchJson<T>(
  input: RequestInfo | URL,
  init?: RequestInit,
  schema?: z.ZodType<T>
): Promise<T> {
  const res = await fetch(input, init);
  const text = await res.text().catch(() => "");
  let data: unknown;
  try {
    data = text ? JSON.parse(text) : undefined;
  } catch {
    data = undefined;
  }
  if (!res.ok) {
    const error = z.object({ error: z.string() }).safeParse(data);
    const message = error.success
      ? error.data.error
      : [res.statusText || `HTTP ${res.status}`, text]
          .filter(Boolean)
          .join(": ");
    throw new Error(message);
  }
  return schema ? schema.parse(data) : (data as T);
}
