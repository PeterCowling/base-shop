#!/usr/bin/env node
/*
  Lint exceptions validator

  - Scans repo files for eslint-disable comments
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
const REGISTRY_PATH = path.join(ROOT, "exceptions.json");
const ESLINT_IGNORE_PATTERNS = require("../tools/eslint-ignore-patterns.cjs");
const SCAN_DIRS = ["apps", "packages", "src"];
const SCAN_EXT_RE = /\.(?:ts|tsx|js|jsx)$/;

const ESLINT_IGNORE_MATCHERS = ESLINT_IGNORE_PATTERNS.map((pat) =>
  pat.endsWith("/") ? `${pat}**` : pat
);

function readJson(p) {
  try {
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch (e) {
    return null;
  }
}

function normalizePath(p) {
  return p.split(path.sep).join("/");
}

function isIgnored(relPath) {
  const p = normalizePath(relPath);
  return ESLINT_IGNORE_MATCHERS.some((pat) => minimatch(p, pat, { dot: true }));
}

function parseFileList(output) {
  return (output ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function listCandidateFiles() {
  // Fast path: use git grep to list files that *mention* eslint-disable.
  const args = ["grep", "-l", "eslint-disable", "--", ...SCAN_DIRS];
  const result = spawnSync("git", args, { cwd: ROOT, encoding: "utf8" });

  // git grep exits with 1 when no matches are found.
  const raw =
    result.status === 0 ? result.stdout : result.status === 1 ? "" : null;

  if (raw === null) {
    // Fallback: list tracked files and scan in-process.
    const ls = spawnSync("git", ["ls-files", ...SCAN_DIRS], {
      cwd: ROOT,
      encoding: "utf8",
    });
    if (ls.status !== 0) {
      throw new Error(
        `[lint-exceptions] Failed to list files via git (exit ${ls.status}).`
      );
    }
    return parseFileList(ls.stdout)
      .filter((p) => SCAN_EXT_RE.test(p))
      .filter((p) => !isIgnored(p))
      .filter((p) => {
        try {
          return fs.readFileSync(path.join(ROOT, p), "utf8").includes(
            "eslint-disable"
          );
        } catch {
          return false;
        }
      });
  }

  return parseFileList(raw)
    .filter((p) => SCAN_EXT_RE.test(p))
    .filter((p) => !isIgnored(p));
}

const DISABLE_RE = /^(?:[ \t]*\/\/\s*eslint-disable(?:-(?:next-)?-line)?[^\n]*|\/\*\s*eslint-disable(?:-(?:next-)?-line)?[^*]*\*\/)$/gm;
const TICKET_RE = /--\s*([^\n*]*)/; // capture justification part after `--`
// Allow ticket IDs with optional sub-prefixes, e.g. `BOS-UX-12`, `UI-LINT-05`.
const DEFAULT_TICKET = /[A-Z]{2,}(?:-[A-Z0-9]{2,})*-\d+/;

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

function main() {
  const registry = readJson(REGISTRY_PATH) || { tickets: {} };
  const files = listCandidateFiles();
  let failures = 0;

  for (const rel of files) {
    const file = path.join(ROOT, rel);
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
          `[lint-exceptions] ${rel}:${c.line} uses ${parsed.ticket} but it is not registered in exceptions.json`,
        );
        failures++;
        continue;
      }
      if (rec.expires && isExpired(rec.expires)) {
        console.error(
          `[lint-exceptions] ${rel}:${c.line} ticket ${parsed.ticket} expired on ${rec.expires}`,
        );
        failures++;
      }
      if (Array.isArray(rec.allow) && rec.allow.length > 0) {
        const ok = rec.allow.some(
          (pat) =>
            minimatch(rel, pat, { dot: true }) ||
            minimatch(file, path.join(ROOT, pat), { dot: true }) ||
            minimatch(file, pat, { dot: true })
        );
        if (!ok) {
          console.error(
            `[lint-exceptions] ${rel}:${c.line} ticket ${parsed.ticket} not allowed for this path (allowed: ${rec.allow.join(", ")})`,
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
