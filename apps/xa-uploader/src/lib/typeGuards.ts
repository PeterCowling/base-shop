export function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function isErrnoCode(error: unknown, code: string): boolean {
  if (!error || typeof error !== "object") return false;
  return (error as NodeJS.ErrnoException).code === code;
}
