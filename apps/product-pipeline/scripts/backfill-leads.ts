/* i18n-exempt file -- PP-1100 backfill helper [ttl=2026-06-30] */
// apps/product-pipeline/scripts/backfill-leads.ts

import { spawnSync } from "node:child_process";
import { rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { fingerprintLead } from "../src/lib/pipeline/fingerprint";

type LeadRow = {
  id: string;
  title: string | null;
  url: string | null;
  triage_score: number | null;
  created_at: string | null;
  fingerprint: string | null;
  duplicate_of: string | null;
};

type CandidateRow = {
  fingerprint: string | null;
  lead_id: string | null;
  created_at: string | null;
};

type LeadState = {
  lead: LeadRow;
  computedFingerprint: string | null;
  nextFingerprint: string | null;
};

const args = new Set(process.argv.slice(2));
const useRemote = args.has("--remote");
const dryRun = args.has("--dry-run");
const force = args.has("--force");

if (args.has("--help")) {
  console.log(
    "Usage: pnpm tsx apps/product-pipeline/scripts/backfill-leads.ts [--remote] [--dry-run] [--force]",
  );
  process.exit(0);
}
const dbName = process.env["PIPELINE_DB_NAME"] ?? "product-pipeline";
const appRoot = resolve(fileURLToPath(new URL(".", import.meta.url)), "..");
const scopeArgs = useRemote ? [] : ["--local"];

function runWrangler(extraArgs: string[]): string {
  const result = spawnSync("pnpm", ["exec", "wrangler", ...extraArgs], {
    cwd: appRoot,
    encoding: "utf8",
  });
  if (result.status !== 0) {
    throw new Error("wrangler d1 execute failed");
  }
  return result.stdout ?? "";
}

function sqlValue(value: string | null | undefined): string {
  if (!value) return "NULL";
  return `'${value.replace(/'/g, "''")}'`;
}

function parseWranglerResults<T>(output: string): T[] {
  const trimmed = output.trim();
  if (!trimmed) return [];
  const parsed = JSON.parse(trimmed) as unknown;
  if (Array.isArray(parsed)) {
    for (const entry of parsed) {
      if (entry && typeof entry === "object" && "results" in entry) {
        const results = (entry as { results?: T[] }).results;
        if (Array.isArray(results)) return results;
      }
    }
  }
  if (parsed && typeof parsed === "object" && "results" in parsed) {
    const results = (parsed as { results?: T[] }).results;
    if (Array.isArray(results)) return results;
  }
  return [];
}

function fetchLeads(): LeadRow[] {
  const output = runWrangler([
    "d1",
    "execute",
    dbName,
    ...scopeArgs,
    "--command",
    "SELECT id, title, url, triage_score, created_at, fingerprint, duplicate_of FROM leads",
    "--json",
  ]);
  return parseWranglerResults<LeadRow>(output);
}

function fetchCandidateFingerprintMap(): Map<string, string | null> {
  const output = runWrangler([
    "d1",
    "execute",
    dbName,
    ...scopeArgs,
    "--command",
    "SELECT fingerprint, lead_id, created_at FROM candidates WHERE fingerprint IS NOT NULL ORDER BY created_at DESC",
    "--json",
  ]);
  const rows = parseWranglerResults<CandidateRow>(output);
  const map = new Map<string, string | null>();
  for (const row of rows) {
    if (!row.fingerprint) continue;
    if (!map.has(row.fingerprint)) {
      map.set(row.fingerprint, row.lead_id ?? null);
    }
  }
  return map;
}

function compareForPrimary(a: LeadRow, b: LeadRow): number {
  const scoreA = a.triage_score ?? -Infinity;
  const scoreB = b.triage_score ?? -Infinity;
  if (scoreA !== scoreB) return scoreB - scoreA;
  const dateA = a.created_at ?? "";
  const dateB = b.created_at ?? "";
  if (dateA !== dateB) return dateA.localeCompare(dateB);
  return a.id.localeCompare(b.id);
}

function buildLeadStates(leads: LeadRow[]): LeadState[] {
  return leads.map((lead) => {
    const computedFingerprint = fingerprintLead({
      title: lead.title,
      url: lead.url,
    });
    const nextFingerprint = force || lead.fingerprint === null
      ? computedFingerprint
      : lead.fingerprint;
    return { lead, computedFingerprint, nextFingerprint };
  });
}

function buildPrimaryLookup(states: LeadState[]): Map<string, string> {
  const groups = new Map<string, LeadRow[]>();
  for (const state of states) {
    if (!state.nextFingerprint) continue;
    const group = groups.get(state.nextFingerprint) ?? [];
    group.push(state.lead);
    groups.set(state.nextFingerprint, group);
  }

  const primaryByFingerprint = new Map<string, string>();
  for (const [fingerprint, members] of groups.entries()) {
    if (members.length < 2) continue;
    const sorted = [...members].sort(compareForPrimary);
    const primary = sorted[0];
    if (!primary) continue;
    primaryByFingerprint.set(fingerprint, primary.id);
  }
  return primaryByFingerprint;
}

function buildUpdates(
  states: LeadState[],
  candidateMap: Map<string, string | null>,
  primaryByFingerprint: Map<string, string>,
): Array<{ id: string; fingerprint: string | null; duplicate_of: string | null }> {
  const updates: Array<{ id: string; fingerprint: string | null; duplicate_of: string | null }> = [];

  for (const state of states) {
    const { lead, nextFingerprint } = state;
    const shouldUpdateFingerprint = force || lead.fingerprint === null;
    const storedFingerprint = shouldUpdateFingerprint ? nextFingerprint : lead.fingerprint;

    let computedDuplicate: string | null = null;
    if (nextFingerprint) {
      const candidateLeadId = candidateMap.get(nextFingerprint) ?? null;
      if (candidateLeadId && candidateLeadId !== lead.id) {
        computedDuplicate = candidateLeadId;
      } else {
        const primaryId = primaryByFingerprint.get(nextFingerprint) ?? null;
        if (primaryId && primaryId !== lead.id) {
          computedDuplicate = primaryId;
        }
      }
    }

    const shouldUpdateDuplicate = force || lead.duplicate_of === null;
    const storedDuplicate = shouldUpdateDuplicate ? computedDuplicate : lead.duplicate_of;

    const fingerprintChanged = storedFingerprint !== lead.fingerprint;
    const duplicateChanged = storedDuplicate !== lead.duplicate_of;
    if (!fingerprintChanged && !duplicateChanged) continue;

    updates.push({
      id: lead.id,
      fingerprint: storedFingerprint ?? null,
      duplicate_of: storedDuplicate ?? null,
    });
  }

  return updates;
}

function buildSql(updates: Array<{ id: string; fingerprint: string | null; duplicate_of: string | null }>): string {
  const statements = updates.map((update) =>
    `UPDATE leads SET fingerprint = ${sqlValue(update.fingerprint)}, duplicate_of = ${sqlValue(update.duplicate_of)} WHERE id = ${sqlValue(update.id)}`,
  );
  return statements.join(";\n") + ";\n";
}

const leads = fetchLeads();
const states = buildLeadStates(leads);
const candidateMap = fetchCandidateFingerprintMap();
const primaryByFingerprint = buildPrimaryLookup(states);
const updates = buildUpdates(states, candidateMap, primaryByFingerprint);

console.log(`Leads scanned: ${leads.length}`);
console.log(`Updates needed: ${updates.length}`);

if (updates.length === 0) {
  process.exit(0);
}

const sql = buildSql(updates);

if (dryRun) {
  console.log("-- dry-run SQL --");
  console.log(sql);
  process.exit(0);
}

const tmpFile = join(tmpdir(), `product-pipeline-backfill-${Date.now()}.sql`);
// eslint-disable-next-line security/detect-non-literal-fs-filename -- PP-1100 temporary file in OS temp directory
writeFileSync(tmpFile, sql, "utf8");

try {
  runWrangler([
    "d1",
    "execute",
    dbName,
    ...scopeArgs,
    "--file",
    tmpFile,
  ]);
  console.log("Backfill applied.");
} finally {
  rmSync(tmpFile, { force: true });
}
