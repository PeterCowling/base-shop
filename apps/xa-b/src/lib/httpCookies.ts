export function parseCookieHeader(header: string | null | undefined): Record<string, string> {
  if (!header) return {};

  const out: Record<string, string> = {};
  for (const segment of header.split(";")) {
    const trimmed = segment.trim();
    if (!trimmed) continue;

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex <= 0) continue;

    const key = trimmed.slice(0, separatorIndex).trim();
    if (!key) continue;

    const rawValue = trimmed.slice(separatorIndex + 1).trim();
    let value = rawValue;
    try {
      value = decodeURIComponent(rawValue);
    } catch {
      value = rawValue;
    }
    out[key] = value;
  }

  return out;
}

export function readCookieValue(
  header: string | null | undefined,
  name: string,
): string | null {
  const cookies = parseCookieHeader(header);
  return cookies[name] ?? null;
}
