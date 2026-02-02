#!/usr/bin/env node
/*
  Lint exceptions validator

  - Reads .eslint-report.json (generated via `pnpm run lint:json`)
  - Scans reported files for eslint-disable comments
  - Extracts ticket IDs from justification (after `--`)
  - Validates presence and TTL against exceptions.json registry

  exceptions.json schema (root of repo):
  {
    "tickets": {
      "ABC-123": {
        "expires": "2099-12-31",           // ISO date; optional means no expiry
        "allow": ["packages/ui/**"],        // optional minimatch patterns restricting usage
        "notes": "optional"
      }
    }
  }
*/
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const { minimatch } = require("minimatch");

const ROOT = process.cwd();
const REPORT_PATH = path.join(ROOT, ".eslint-report.json");
const REGISTRY_PATH = path.join(ROOT, "exceptions.json");

function readJson(p) {
  try {
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch (e) {
    return null;
  }
}

function listFilesFromReport(report) {
  if (!Array.isArray(report)) return [];
  const s = new Set();
  for (const entry of report) {
    if (entry && typeof entry.filePath === "string") s.add(entry.filePath);
  }
  return Array.from(s);
}

const DISABLE_RE = /^(?:[ \t]*\/\/\s*eslint-disable(?:-(?:next-)?-line)?[^\n]*|\/\*\s*eslint-disable(?:-(?:next-)?-line)?[^*]*\*\/)$/gm;
const TICKET_RE = /--\s*([^\n*]*)/; // capture justification part after `--`
const DEFAULT_TICKET = /[A-Z]{2,}-\d+/;

function findDisableComments(content) {
  const out = [];
  let m;
  while ((m = DISABLE_RE.exec(content))) {
    const raw = m[0];
    const idx = m.index;
    const before = content.slice(0, idx);
    const line = before.split(/\r?\n/).length;
    out.push({ raw, line });
  }
  return out;
}

function extractTicket(raw) {
  const just = TICKET_RE.exec(raw);
  if (!just) return null;
  const part = just[1].trim();
  const ticket = (part.match(DEFAULT_TICKET) || [])[0] || null;
  // Optional ttl metadata parsing (ttl=YYYY-MM-DD|expires=YYYY-MM-DD|until=YYYY-MM-DD)
  const ttlMatch = part.match(/(?:ttl|expires|until)\s*=\s*(\d{4}-\d{2}-\d{2})/i);
  const ttl = ttlMatch ? ttlMatch[1] : null;
  return { ticket, ttl, justification: part };
}

function isExpired(dateStr) {
  if (!dateStr) return false;
  const d = new Date(dateStr + "T00:00:00Z");
  if (Number.isNaN(d.getTime())) return false; // ignore invalid
  const today = new Date();
  const t = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  return d.getTime() < t.getTime();
}

function ensureReport() {
  if (fs.existsSync(REPORT_PATH)) {
    return true;
  }
  console.log(`[lint-exceptions] ${REPORT_PATH} missing; generating via pnpm run lint:json`);
  const result = spawnSync("pnpm", ["run", "lint:json"], {
    cwd: ROOT,
    stdio: "inherit",
    env: process.env,
  });
  if (result.error) {
    console.error(`[lint-exceptions] Failed to run lint:json: ${result.error.message}`);
    return false;
  }
  return result.status === 0 && fs.existsSync(REPORT_PATH);
}

function main() {
  if (!ensureReport()) {
    process.exit(2);
  }
  const report = readJson(REPORT_PATH);
  if (!report) {
    console.error(`[lint-exceptions] Missing ${REPORT_PATH} after generation.`);
    process.exit(2);
  }
  const registry = readJson(REGISTRY_PATH) || { tickets: {} };
  const files = listFilesFromReport(report);
  let failures = 0;

  for (const file of files) {
    let content;
    try {
      content = fs.readFileSync(file, "utf8");
    } catch {
      continue;
    }
    const comments = findDisableComments(content);
    for (const c of comments) {
      const parsed = extractTicket(c.raw);
      if (!parsed || !parsed.ticket) {
        // Rule enforcement will flag missing tickets; skip here
        continue;
      }
      const rec = registry.tickets?.[parsed.ticket];
      if (!rec) {
        console.error(
          `[lint-exceptions] ${file}:${c.line} uses ${parsed.ticket} but it is not registered in exceptions.json`,
        );
        failures++;
        continue;
      }
      if (rec.expires && isExpired(rec.expires)) {
        console.error(
          `[lint-exceptions] ${file}:${c.line} ticket ${parsed.ticket} expired on ${rec.expires}`,
        );
        failures++;
      }
      if (Array.isArray(rec.allow) && rec.allow.length > 0) {
        const ok = rec.allow.some((pat) => minimatch(file, path.join(ROOT, pat)) || minimatch(file, pat));
        if (!ok) {
          console.error(
            `[lint-exceptions] ${file}:${c.line} ticket ${parsed.ticket} not allowed for this path (allowed: ${rec.allow.join(", ")})`,
          );
          failures++;
        }
      }
    }
  }

  if (failures > 0) {
    console.error(`[lint-exceptions] Found ${failures} exception validation error(s).`);
    process.exit(1);
  }
  console.log(`[lint-exceptions] All exceptions are valid.`);
}

main();
