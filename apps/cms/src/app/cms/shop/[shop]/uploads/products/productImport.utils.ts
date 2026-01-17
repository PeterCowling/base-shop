export type ProductImportItemInput = {
  sku: string;
  title?: string;
  description?: string;
  price?: number;
  currency?: string;
  status?: string;
  media_urls?: string[];
  publish_shops?: string[];
  [key: string]: string | number | string[] | undefined;
};

type ParseResult =
  | { ok: true; items: ProductImportItemInput[] }
  | { ok: false; error: string };

const LIST_SPLIT_RE = /[|;,]/;

function parseListValue(value: string): string[] {
  return value
    .split(LIST_SPLIT_RE)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      out.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  out.push(current);
  return out;
}

export function parseCsvToItems(csv: string): ParseResult {
  const lines = csv
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (!lines.length) {
    return { ok: false, error: "CSV file is empty." };
  }

  const headers = parseCsvLine(lines[0]).map((header) => header.trim());
  if (!headers.length || !headers.some((header) => header === "sku")) {
    return { ok: false, error: "CSV must include a 'sku' column." };
  }

  const items: ProductImportItemInput[] = [];

  for (let i = 1; i < lines.length; i += 1) {
    const cells = parseCsvLine(lines[i]);
    const item: ProductImportItemInput = { sku: "" };
    let hasData = false;

    headers.forEach((key, idx) => {
      const raw = cells[idx] ?? "";
      const value = raw.trim();
      if (!value) return;
      hasData = true;

      if (key === "title_en") {
        if (!item.title) item.title = value;
        return;
      }
      if (key === "description_en") {
        if (!item.description) item.description = value;
        return;
      }
      if (key === "media_urls" || key === "publish_shops") {
        item[key] = parseListValue(value);
        return;
      }
      if (key === "price") {
        const parsed = Number(value);
        if (!Number.isFinite(parsed)) {
          return;
        }
        item.price = parsed;
        return;
      }

      item[key] = value;
    });

    if (!hasData) continue;
    item.sku = (item.sku ?? "").trim();
    if (!item.sku) {
      return { ok: false, error: `Row ${i + 1} is missing a sku.` };
    }

    items.push(item);
  }

  if (!items.length) {
    return { ok: false, error: "No valid items found in the CSV." };
  }

  return { ok: true, items };
}

export function parseItemsJson(raw: string): ParseResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, error: "Invalid JSON." };
  }

  if (!Array.isArray(parsed)) {
    return { ok: false, error: "JSON must be an array of items." };
  }

  const items: ProductImportItemInput[] = [];
  for (let i = 0; i < parsed.length; i += 1) {
    const entry = parsed[i];
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      return { ok: false, error: `Item ${i + 1} must be an object.` };
    }
    const record = entry as Record<string, unknown>;
    const sku = typeof record.sku === "string" ? record.sku.trim() : "";
    if (!sku) {
      return { ok: false, error: `Item ${i + 1} is missing a sku.` };
    }
    items.push({ ...(record as ProductImportItemInput), sku });
  }

  if (!items.length) {
    return { ok: false, error: "Add at least one item." };
  }

  return { ok: true, items };
}

export function exampleItemsJson(): string {
  return JSON.stringify(
    [
      {
        sku: "sample-001",
        title: "Sample product",
        description: "A starter product for import testing.",
        price: 49,
        currency: "EUR",
        status: "draft",
        media_urls: ["https://cdn.example.com/sample-001.jpg"],
        publish_shops: ["brikette"],
      },
      {
        sku: "sample-002",
        title: "Sample product two",
        description: "Second sample item with pricing and media.",
        price: 89,
        currency: "EUR",
        status: "active",
        media_urls: ["https://cdn.example.com/sample-002.jpg"],
        publish_shops: ["brikette"],
      },
    ],
    null,
    2,
  );
}

export function createIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
