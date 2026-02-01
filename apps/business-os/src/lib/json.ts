export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function getStringProp(obj: unknown, key: string): string | undefined {
  if (!isRecord(obj)) return undefined;
  const value = obj[key];
  return typeof value === "string" ? value : undefined;
}

export function getRecordProp(
  obj: unknown,
  key: string
): Record<string, unknown> | undefined {
  if (!isRecord(obj)) return undefined;
  const value = obj[key];
  return isRecord(value) ? value : undefined;
}

export async function readJsonSafely(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

