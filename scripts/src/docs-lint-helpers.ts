import type { DocHeader } from "./docs-lint-types";

export function parseHeader(content: string): DocHeader {
  const lines = content.split(/\r?\n/).slice(0, 50);
  const get = (prefix: string) => {
    const line = lines.find((l) => l.startsWith(prefix));
    return line ? line.slice(prefix.length).trim() || null : null;
  };
  const type = get("Type:");
  const status = get("Status:");
  const domain = get("Domain:");
  const business = get("Business:");
  const owner = get("Owner:");
  const id = get("ID:");
  const lane = get("Lane:");
  const priority = get("Priority:");
  const cardId = get("Card-ID:");
  const author = get("Author:");
  const created = get("Created:");
  const lastReviewed = get("Last-reviewed:");
  const lastUpdated = get("Last-updated:");
  const hasCodePointers = lines.some(
    (l) =>
      l.startsWith("Primary code entrypoints:") ||
      l.startsWith("Canonical code:"),
  );
  return {
    type,
    status,
    domain,
    hasCodePointers,
    business,
    owner,
    id,
    lane,
    priority,
    cardId,
    author,
    created,
    lastReviewed,
    lastUpdated,
  };
}
