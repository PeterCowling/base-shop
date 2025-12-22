/* i18n-exempt file -- PP-1100 seed script [ttl=2026-06-30] */
// apps/product-pipeline/scripts/seed.ts

import { spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { fingerprintLead } from "../src/lib/pipeline/fingerprint";

type LeadSeed = {
  id: string;
  source: string;
  sourceContext: string;
  title: string;
  url: string;
  priceBand: string;
};

const args = new Set(process.argv.slice(2));
const useRemote = args.has("--remote");
const reset = args.has("--reset");
const dbName =
  process.env["PIPELINE_DB_NAME"] ??
  (useRemote ? "product-pipeline" : "PIPELINE_DB");
const appRoot = resolve(fileURLToPath(new URL(".", import.meta.url)), "..");

function runWrangler(extraArgs: string[]): void {
  const result = spawnSync("pnpm", ["exec", "wrangler", ...extraArgs], {
    cwd: appRoot,
    stdio: "inherit",
  });
  if (result.status !== 0) {
    throw new Error("wrangler d1 execute failed");
  }
}

function runWranglerJson(extraArgs: string[]): unknown {
  const result = spawnSync("pnpm", ["exec", "wrangler", ...extraArgs, "--json"], {
    cwd: appRoot,
    encoding: "utf8",
  });
  if (result.status !== 0) {
    throw new Error("wrangler d1 execute failed");
  }
  const stdout = result.stdout?.trim();
  if (!stdout) return null;
  return JSON.parse(stdout) as unknown;
}

function extractRows(payload: unknown): Record<string, unknown>[] {
  if (!Array.isArray(payload)) return [];
  const first = payload[0] as { results?: Record<string, unknown>[] } | undefined;
  if (!first || !Array.isArray(first.results)) return [];
  return first.results;
}

function tableExists(name: string, scopeArgs: string[]): boolean {
  const result = runWranglerJson([
    "d1",
    "execute",
    dbName,
    ...scopeArgs,
    "--command",
    `SELECT name FROM sqlite_master WHERE type='table' AND name = ${sqlValue(name)}`,
  ]);
  return extractRows(result).length > 0;
}

function columnExists(
  table: string,
  column: string,
  scopeArgs: string[],
): boolean {
  const result = runWranglerJson([
    "d1",
    "execute",
    dbName,
    ...scopeArgs,
    "--command",
    `PRAGMA table_info(${table})`,
  ]);
  return extractRows(result).some((row) => row.name === column);
}

function migrationApplied(name: string, scopeArgs: string[]): boolean {
  const result = runWranglerJson([
    "d1",
    "execute",
    dbName,
    ...scopeArgs,
    "--command",
    `SELECT 1 FROM d1_migrations WHERE name = ${sqlValue(name)} LIMIT 1`,
  ]);
  return extractRows(result).length > 0;
}

function markMigrationApplied(name: string, scopeArgs: string[]): void {
  runWrangler([
    "d1",
    "execute",
    dbName,
    ...scopeArgs,
    "--command",
    `INSERT INTO d1_migrations (name) VALUES (${sqlValue(name)})`,
  ]);
}

function sqlValue(value: string | null | undefined): string {
  if (!value) return "NULL";
  return `'${value.replace(/'/g, "''")}'`;
}

const scopeArgs = useRemote ? [] : ["--local"];
if (tableExists("d1_migrations", scopeArgs)) {
  const migrationName = "0009_leads_fingerprint_duplicate.sql";
  const hasFingerprint = columnExists("leads", "fingerprint", scopeArgs);
  const hasDuplicate = columnExists("leads", "duplicate_of", scopeArgs);
  if ((hasFingerprint || hasDuplicate) && !migrationApplied(migrationName, scopeArgs)) {
    markMigrationApplied(migrationName, scopeArgs);
  }
}

runWrangler(["d1", "migrations", "apply", dbName, ...scopeArgs]);

const leads: LeadSeed[] = [
  {
    id: randomUUID(),
    source: "amazon_gap_scan",
    sourceContext: "storage/organizers",
    title: "Stackable closet organizer set",
    url: "https://www.amazon.de/s?k=closet+organizer",
    priceBand: "8-16",
  },
  {
    id: randomUUID(),
    source: "adjacency_mining",
    sourceContext: "kitchen/meal-prep",
    title: "Glass meal prep containers with lids",
    url: "https://www.amazon.fr/s?k=meal+prep+containers",
    priceBand: "12-24",
  },
  {
    id: randomUUID(),
    source: "supplier_catalog",
    sourceContext: "trusted-supplier-2025q1",
    title: "Foldable laundry baskets",
    url: "https://www.taobao.com",
    priceBand: "5-12",
  },
  {
    id: randomUUID(),
    source: "customize_pain",
    sourceContext: "review-theme:leaks",
    title: "Leakproof travel bottle set",
    url: "https://www.amazon.it/s?k=travel+bottles+leakproof",
    priceBand: "9-18",
  },
  {
    id: randomUUID(),
    source: "amazon_gap_scan",
    sourceContext: "home/lighting",
    title: "USB rechargeable cabinet lights",
    url: "https://www.amazon.es/s?k=usb+cabinet+light",
    priceBand: "14-28",
  },
];

const statements: string[] = [];
if (reset) {
  statements.push(
    "DELETE FROM artifacts",
    "DELETE FROM stage_runs",
    "DELETE FROM candidates",
    "DELETE FROM leads",
    "DELETE FROM cooldowns",
    "DELETE FROM supplier_terms",
    "DELETE FROM suppliers",
  );
}

const now = new Date().toISOString();
const values = leads
  .map((lead) => {
    const fingerprint = fingerprintLead({ title: lead.title, url: lead.url });
    return `(${sqlValue(lead.id)}, ${sqlValue(lead.source)}, ${sqlValue(lead.sourceContext)}, ${sqlValue(lead.title)}, ${sqlValue(lead.url)}, ${sqlValue(lead.priceBand)}, ${sqlValue(fingerprint)}, ${sqlValue(null)}, ${sqlValue("NEW")}, ${sqlValue(now)}, ${sqlValue(now)})`;
  })
  .join(",\n");

statements.push(
  "INSERT INTO leads (id, source, source_context, title, url, price_band, fingerprint, duplicate_of, status, created_at, updated_at) VALUES\n" +
    values,
);

const seedSql = `${statements.join(";\n")};\n`;
const tmpFile = join(tmpdir(), `product-pipeline-seed-${Date.now()}.sql`);
// eslint-disable-next-line security/detect-non-literal-fs-filename -- PP-1100 temp file path in OS temp dir
writeFileSync(tmpFile, seedSql, "utf8");

try {
  runWrangler([
    "d1",
    "execute",
    dbName,
    ...scopeArgs,
    "--file",
    tmpFile,
  ]);
} finally {
  rmSync(tmpFile, { force: true });
}

console.log(`Seeded ${leads.length} leads into ${dbName}.`);
console.log(leads.map((lead) => `- ${lead.id} ${lead.title}`).join("\n"));
