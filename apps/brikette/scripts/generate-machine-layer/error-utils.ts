const hasErrorCode = (value: unknown, code: string): value is NodeJS.ErrnoException =>
  typeof value === "object" &&
  value !== null &&
  typeof (value as { code?: unknown }).code === "string" &&
  (value as NodeJS.ErrnoException).code === code;

const messageIncludes = (value: unknown, substring: string): boolean =>
  typeof value === "object" &&
  value !== null &&
  typeof (value as { message?: unknown }).message === "string" &&
  (value as { message: string }).message.includes(substring);

const looksLikeFileMissing = (error: unknown): boolean =>
  hasErrorCode(error, "ENOENT") || messageIncludes(error, "ENOENT");

export { hasErrorCode, looksLikeFileMissing };