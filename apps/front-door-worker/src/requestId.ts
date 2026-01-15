export const REQUEST_ID_HEADER = "x-request-id";

function newRequestId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  }
}

export function getOrCreateRequestId(headers: Headers): string {
  const existing = headers.get(REQUEST_ID_HEADER);
  if (typeof existing === "string" && existing.trim()) return existing.trim();
  return newRequestId();
}

