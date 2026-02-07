export function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function getStringField(
  value: unknown,
  key: string
): string | undefined {
  if (!isRecord(value)) {
    return undefined;
  }
  const candidate = value[key];
  return typeof candidate === "string" ? candidate : undefined;
}

export function getRecordField(
  value: unknown,
  key: string
): Record<string, unknown> | undefined {
  if (!isRecord(value)) {
    return undefined;
  }
  const candidate = value[key];
  return isRecord(candidate) ? candidate : undefined;
}

export function getErrorField(value: unknown): string | undefined {
  return getStringField(value, "error");
}

export async function safeReadJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

// Backwards-compatible aliases (main branch usage)
export { getStringField as getStringProp };
export { getRecordField as getRecordProp };
export { safeReadJson as readJsonSafely };

