// File: /src/utils/zodErrorToString.ts

import type { ZodError } from 'zod';

/**
 * Converts a **Zod 4** `ZodError` into a single, developer-friendly string.
 *
 * Each issue is rendered as:
 *
 * ```
 * path: message (code=<code>[, <extra>=<value>...])
 * ```
 *
 * - **path** – dot-joined path; `(root)` if empty.
 * - **message** – Zod's human-readable message.
 * - **code** – the {@link https://zod.dev/error-codes Zod issue code}.
 * - **extras** – Any additional enumerable fields provided by that issue type
 *   (`expected`, `received`, `minimum`, `type`, etc.). These are discovered
 *   dynamically so the utility keeps working if new fields appear in future
 *   Zod versions.
 *
 * @example
 * ```ts
 * try {
 *   schema.parse(data);
 * } catch (err) {
 *   if (err instanceof ZodError) {
 *     console.error(zodErrorToString(err));
 *   }
 * }
 * // ➜ guest.0.checkInDate: Required (code=invalid_type, expected=string, received=undefined);
 * //   booking.1234.roomNumbers: Too few items (code=too_small, minimum=1, inclusive=false)
 * ```
 */
export function zodErrorToString(error: ZodError): string {
  return error.issues
    .map((issue) => {
      const path =
        issue.path && issue.path.length > 0 ? issue.path.join('.') : '(root)';

      // Pull out non-standard keys for extra context
      const extras = Object.entries(issue)
        .filter(([key]) => !['code', 'path', 'message'].includes(key))
        .map(
          ([key, value]) =>
            `${key}=${typeof value === 'object' ? JSON.stringify(value) : value}`,
        )
        .join(', ');

      const codePart = `code=${issue.code}`;
      const extraPart = extras ? `, ${extras}` : '';

      return `${path}: ${issue.message} (${codePart}${extraPart})`;
    })
    .join('; ');
}
