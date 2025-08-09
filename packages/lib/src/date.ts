export function parseIsoDate(str: string): Date | null {
  if (typeof str !== "string") return null;
  const ISO_REGEX = /^(\d{4}-\d{2}-\d{2})(?:T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?)?$/;
  if (!ISO_REGEX.test(str)) return null;
  const date = new Date(str);
  return Number.isNaN(date.getTime()) ? null : date;
}
