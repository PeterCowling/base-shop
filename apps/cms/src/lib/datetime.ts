export const nowIso = (): string => new Date().toISOString();

export function formatTimestamp(ts: string, locale?: string): string {
  const date = /^\d+$/.test(ts) ? new Date(Number(ts)) : new Date(ts);
  return Number.isNaN(date.getTime()) ? ts : date.toLocaleString(locale);
}
