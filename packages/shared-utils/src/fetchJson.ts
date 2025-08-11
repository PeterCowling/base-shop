import { z } from "zod";

export async function fetchJson<T>(
  input: RequestInfo | URL,
  init?: RequestInit,
  schema?: z.ZodType<T>,
): Promise<T> {
  const res = await fetch(input, init);
  let data: any;
  try {
    const text = await res.text();
    data = text ? JSON.parse(text) : undefined;
  } catch {
    data = undefined;
  }
  if (!res.ok) {
    const message =
      (data && data.error) || res.statusText || `HTTP ${res.status}`;
    throw new Error(message);
  }
  return schema ? schema.parse(data) : (data as T);
}
