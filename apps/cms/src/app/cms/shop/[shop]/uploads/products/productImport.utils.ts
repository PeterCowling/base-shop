import { LOCALES } from "@acme/types";

export function createIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function exampleItemsJson(): string {
  return JSON.stringify(
    [
      {
        sku: "example-sku",
        title: { en: "Example product" },
        description: { en: "Short description" },
        price: 1999,
        currency: "EUR",
        status: "draft",
        media: ["/uploads/your-shop/example.png"],
      },
    ],
    null,
    2,
  );
}

function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === "\"") {
        if (line[i + 1] === "\"") {
          current += "\"";
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
      continue;
    }
    if (ch === "\"") {
      inQuotes = true;
      continue;
    }
    if (ch === ",") {
      out.push(current);
      current = "";
      continue;
    }
    current += ch;
  }
  out.push(current);
  return out.map((cell) => cell.trim());
}

function parseCsvRows(csv: string): Array<Record<string, string>> {
  const lines = csv
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length < 2) return [];
  const headers = parseCsvLine(lines[0]).map((h) => h.trim());
  if (!headers.length) return [];
  const rows: Array<Record<string, string>> = [];
  for (const line of lines.slice(1)) {
    const cells = parseCsvLine(line);
    const row: Record<string, string> = {};
    for (const [idx, header] of headers.entries()) {
      row[header] = cells[idx] ?? "";
    }
    rows.push(row);
  }
  return rows;
}

function splitList(raw: string): string[] {
  const trimmed = raw.trim();
  if (!trimmed) return [];
  const sep = trimmed.includes("|") ? "|" : trimmed.includes(";") ? ";" : ",";
  return trimmed
    .split(sep)
    .map((v) => v.trim())
    .filter(Boolean);
}

function buildTranslatedFromCsvRow(
  row: Record<string, string>,
  prefix: "title" | "description",
): string | Record<string, string> | undefined {
  const keyed: Record<string, string> = {};
  for (const locale of LOCALES) {
    const value = row[`${prefix}_${locale}`];
    if (typeof value === "string" && value.trim()) keyed[locale] = value.trim();
  }
  if (Object.keys(keyed).length) return keyed;
  const flat = row[prefix];
  if (typeof flat === "string" && flat.trim()) return flat.trim();
  return undefined;
}

export function parseCsvToItems(
  csv: string,
): { ok: true; items: unknown[] } | { ok: false; error: string } {
  const rows = parseCsvRows(csv);
  if (!rows.length) {
    return { ok: false, error: "CSV must include a header row and at least one data row." };
  }

  const items = rows.map((row) => {
    const item: Record<string, unknown> = {};

    const id = row.id?.trim();
    if (id) item.id = id;

    const sku = row.sku?.trim();
    if (sku) item.sku = sku;

    const title = buildTranslatedFromCsvRow(row, "title");
    if (title !== undefined) item.title = title;

    const description = buildTranslatedFromCsvRow(row, "description");
    if (description !== undefined) item.description = description;

    const priceRaw = row.price?.trim();
    if (priceRaw) {
      const price = Number(priceRaw);
      if (Number.isFinite(price)) {
        item.price = Math.trunc(price);
      }
    }

    const currency = row.currency?.trim();
    if (currency) item.currency = currency;

    const status = row.status?.trim();
    if (status) item.status = status;

    const publishShops = row.publishShops?.trim() ?? row.publish_shops?.trim();
    if (publishShops) item.publishShops = splitList(publishShops);

    const mediaUrls = row.media?.trim() ?? row.mediaUrls?.trim() ?? row.media_urls?.trim();
    if (mediaUrls) item.media = splitList(mediaUrls);

    return item;
  });

  return { ok: true, items };
}

export function parseItemsJson(
  raw: string,
): { ok: true; items: unknown[] } | { ok: false; error: string } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, error: "Items must be valid JSON." };
  }
  if (Array.isArray(parsed)) return { ok: true, items: parsed };
  if (parsed && typeof parsed === "object") {
    const items = (parsed as { items?: unknown }).items;
    if (Array.isArray(items)) {
      return { ok: true, items };
    }
  }
  return { ok: false, error: "Items JSON must be an array (or an object with an 'items' array)." };
}
