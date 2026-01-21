import { ZodError } from "zod";

/**
 * Returns a user friendly message for various error types.
 * This function is pure and has no side effects.
 * @param err - unknown error value
 */
export function getErrorMessage(err: unknown): string {
  if (err instanceof ZodError) {
    const issues = err.issues.slice(0, 3).map((i) => {
      const path = i.path.join(".") || "value";
      return `${path}: ${i.message}`;
    });
    const extra = err.issues.length - issues.length;
    const intro = `Validation failed - ${issues.join("; ")}`;
    return extra > 0 ? `${intro}; and ${extra} more issue(s)` : intro;
  }
  if (err instanceof Error) {
    return err.message;
  }
  return String(err);
}

export default getErrorMessage;
