export function parseLimit(limit: string | number): number {
  if (typeof limit === "number") return limit;
  const match = /^(\d+)(b|kb|mb|gb)$/i.exec(limit.trim());
  if (!match) {
    // i18n-exempt: developer-facing validation message
    throw new Error("Invalid limit");
  }
  const [, num, unit] = match;
  const sizes: Record<string, number> = {
    b: 1,
    kb: 1024,
    mb: 1024 * 1024,
    gb: 1024 * 1024 * 1024,
  };
  return Number(num) * sizes[unit.toLowerCase()];
}
