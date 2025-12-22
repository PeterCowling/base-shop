/* eslint-disable ds/no-hardcoded-copy -- LINT-1007 [ttl=2026-12-31] Non-UI literals pending localization. */
// src/utils/validate.ts
import { z, ZodTypeAny } from "zod";

/**
 * Validate an unknown `data` payload against a Zod `schema`.
 * On failure, throw a `Response` with a JSON body so that
 * React Router’s error boundary can surface the details.
 *
 * @param schema – Zod schema to validate against
 * @param data   – unknown payload (URL params, query string, JSON, etc.)
 * @param status – HTTP status code for validation errors (default 400)
 * @returns the parsed data with its full static type (`z.infer<S>`)
 */
export function validateOrThrow<S extends ZodTypeAny>(
  schema: S,
  data: unknown,
  status = 400,
): z.infer<S> {
  const parsed = schema.safeParse(data);

  if (!parsed.success) {
    throw Response.json(
      {
        message: "Validation failed",
        issues: parsed.error.issues,
      },
      { status },
    );
  }

  return parsed.data;
}
