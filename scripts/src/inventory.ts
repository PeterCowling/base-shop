// scripts/src/inventory.ts
// Inventory import/export helper calling CMS API endpoints.
/* i18n-exempt file -- ENG-2401 CLI-only inventory helper messaging; not user-facing UI [ttl=2026-12-31] */
import { readFile, writeFile } from "node:fs/promises";
import { basename, resolve } from "node:path";
import { parseArgs } from "node:util";

async function importInventory(shop: string, file: string, base: string): Promise<void> {
  const sourcePath = resolve(file);
   
  const buf = await readFile(sourcePath);
  const contentType = sourcePath.endsWith(".csv") ? "text/csv" : "application/json";
  const form = new FormData();
  form.append("file", new Blob([buf], { type: contentType }), basename(sourcePath));
  const res = await fetch(`${base}/cms/api/data/${shop}/inventory/import`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) {
    const text = await res.text();
    const prefix = res.status >= 500 ? "Inventory backend unavailable" : "Import failed";
    throw new Error(`${prefix}: ${res.status} ${text}`);
  }
  console.log(`Imported inventory from ${sourcePath}`);
}

async function exportInventory(shop: string, file: string, base: string): Promise<void> {
  const targetPath = resolve(file);
  const format = targetPath.endsWith(".csv") ? "csv" : "json";
  const url = `${base}/cms/api/data/${shop}/inventory/export${
    format === "csv" ? "?format=csv" : ""
  }`;
  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text();
    const prefix = res.status >= 500 ? "Inventory backend unavailable" : "Export failed";
    throw new Error(`${prefix}: ${res.status} ${text}`);
  }
  const data = Buffer.from(await res.arrayBuffer());
   
  await writeFile(targetPath, data);
  console.log(`Saved inventory to ${targetPath}`);
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
