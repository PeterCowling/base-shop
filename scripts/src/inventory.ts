// scripts/src/inventory.ts
// Inventory import/export helper calling CMS API endpoints.
import { readFile, writeFile } from "node:fs/promises";
import { basename } from "node:path";
import { parseArgs } from "node:util";

interface Options {
  file: string;
  url?: string;
}

async function importInventory(shop: string, file: string, base: string): Promise<void> {
  const buf = await readFile(file);
  const contentType = file.endsWith(".csv") ? "text/csv" : "application/json";
  const form = new FormData();
  form.append("file", new Blob([buf], { type: contentType }), basename(file));
  const res = await fetch(`${base}/cms/api/data/${shop}/inventory/import`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Import failed: ${res.status} ${text}`);
  }
  console.log(`Imported inventory from ${file}`);
}

async function exportInventory(shop: string, file: string, base: string): Promise<void> {
  const format = file.endsWith(".csv") ? "csv" : "json";
  const url = `${base}/cms/api/data/${shop}/inventory/export${
    format === "csv" ? "?format=csv" : ""
  }`;
  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Export failed: ${res.status} ${text}`);
  }
  const data = Buffer.from(await res.arrayBuffer());
  await writeFile(file, data);
  console.log(`Saved inventory to ${file}`);
}

async function main(): Promise<void> {
  const { values, positionals } = parseArgs({
    options: {
      file: { type: "string", short: "f" },
      url: { type: "string" },
    },
    allowPositionals: true,
  });
  const [cmd, shop] = positionals;
  if (!cmd || !shop || typeof values.file !== "string") {
    console.error("Usage: pnpm inventory <import|export> <shop> --file <path> [--url <baseUrl>]");
    process.exit(1);
  }
  const base = (values.url || process.env.CMS_BASE_URL || "http://localhost:3000").replace(/\/$/, "");
  if (cmd === "import") {
    await importInventory(shop, values.file, base);
  } else if (cmd === "export") {
    await exportInventory(shop, values.file, base);
  } else {
    console.error(`Unknown command: ${cmd}`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
