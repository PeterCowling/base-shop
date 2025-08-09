const DAY_MS = 86_400_000;

export function isoDateInNDays(days: number): string {
  return new Date(Date.now() + days * DAY_MS).toISOString().slice(0, 10);
}

export { DAY_MS };
