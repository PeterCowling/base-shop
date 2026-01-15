const ensureHttps = (value: string): string => {
  const trimmed = value.trim().replace(/\/$/, "");
  if (!trimmed) return trimmed;
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  return `https://${trimmed}`;
};

/**
 * Machine-layer scripts run in long-lived Vitest workers. Read `process.env`
 * directly at call time so tests can mutate the base URL without needing to
 * reset the full module graph.
 */
export function resolveMachineBaseUrl(fallback: string): string {
  const raw =
    typeof process !== "undefined" && process.env
      ? process.env.PUBLIC_BASE_URL ?? process.env.NEXT_PUBLIC_BASE_URL
      : undefined;
  if (typeof raw === "string" && raw.trim()) {
    return ensureHttps(raw);
  }
  return fallback.replace(/\/$/, "");
}

