/**
 * tm-prescreen-cli.ts
 *
 * Reads a newline-separated list of name candidates from stdin,
 * generates structured TM pre-screen direction (EUIPO, WIPO GBD, and UIBM
 * search URLs for configurable Nice Classification classes), outputs the
 * direction text to stdout, and writes sidecar events (generated +
 * tm_prescreened) for each name to the configured sidecars directory.
 *
 * This CLI produces direction only — it makes no HTTP requests to trademark
 * registries. The operator follows the URLs to complete the search manually.
 *
 * Usage:
 *   echo -e "Cerchietto\nSicura\nLibera" | npx tsx scripts/src/startup-loop/naming/tm-prescreen-cli.ts
 *   head -20 names.txt | npx tsx scripts/src/startup-loop/naming/tm-prescreen-cli.ts > out.txt
 *
 * Sidecar events are written to:
 *   docs/business-os/strategy/HEAD/product-naming-sidecars/
 *
 * Environment variable overrides (optional):
 *   TM_SIDECAR_DIR    — override default sidecar directory
 *   TM_RUN_DATE       — override default run date (YYYY-MM-DD)
 *   TM_ROUND          — override default round number (integer)
 *   TM_BUSINESS       — override default business identifier
 *   TM_NICE_CLASSES   — comma-separated list of Nice Classification class numbers
 *                        (e.g. "35,25,26" for brand naming; default "25,26" for
 *                        product line naming backward compat)
 */

import * as readline from 'node:readline';

import {
  type CandidateRecord,
  generateEventId,
  type SidecarEvent,
  type TmPrescreenRecord,
  writeSidecarEvent,
} from './event-log-writer.js';

// ---------------------------------------------------------------------------
// Constants — override via env vars for testing (use a temp dir for dry runs)
// ---------------------------------------------------------------------------

const SIDECAR_DIR =
  process.env['TM_SIDECAR_DIR'] ??
  '/Users/petercowling/base-shop/docs/business-os/strategy/HEAD/product-naming-sidecars';

const RUN_DATE = process.env['TM_RUN_DATE'] ?? '2026-02-26';
const ROUND = process.env['TM_ROUND'] != null ? parseInt(process.env['TM_ROUND'], 10) : 1;
const BUSINESS = process.env['TM_BUSINESS'] ?? 'HEAD';

/**
 * Nice Classification classes to search. Configurable via TM_NICE_CLASSES env
 * var (comma-separated list of class numbers, e.g. "35,25,26").
 *
 * Default "25,26" for backward compatibility with the product line naming
 * pipeline (HEAD hairband accessories: Class 25 headgear, Class 26 hair
 * accessories).
 *
 * For brand/company naming, use "35,25,26" or adjust per business category:
 *   Class 35 — retail services, advertising, business management
 *   Class 25 — clothing, footwear, headgear
 *   Class 26 — lace, embroidery, ribbons, hair accessories
 *   Class 14 — jewellery, watches, precious metals
 */
const TM_CLASSES: readonly number[] = (() => {
  const raw = process.env['TM_NICE_CLASSES'];
  if (raw != null && raw.trim().length > 0) {
    return raw
      .split(',')
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => !isNaN(n) && n >= 1 && n <= 99);
  }
  // Default: Classes 25 and 26 (product line naming backward compat)
  return [25, 26];
})();

// ---------------------------------------------------------------------------
// URL generators
// ---------------------------------------------------------------------------

/**
 * Generate an EUIPO eTMview pre-filled search URL for a candidate name.
 * URL format confirmed from ASSESSMENT-13 artifact and EUIPO eSearch documentation.
 * Falls back to the base eSearch URL with a manual-entry instruction if the
 * deep-link format changes.
 */
function buildEuipoUrl(name: string): string {
  const encoded = encodeURIComponent(name);
  return `https://euipo.europa.eu/eSearch/#basic?criteria=WORD&searchTerm=${encoded}`;
}

/**
 * Generate a WIPO Global Brand Database pre-filled search URL.
 * The quicksearch endpoint accepts a `query` parameter for word mark search.
 */
function buildWipoUrl(name: string): string {
  const encoded = encodeURIComponent(name);
  return `https://branddb.wipo.int/en/quicksearch/brand?query=${encoded}`;
}

/**
 * Generate a UIBM (Italian national trademark register) URL.
 * UIBM does not publish a confirmed query-parameter deep-link format for its
 * bancadati system. The base URL is provided with a manual search instruction.
 */
function buildUibmUrl(_name: string): string {
  // Note: no confirmed query-param format for UIBM deep-link as of 2026-02-26.
  // Operator must navigate to the URL and enter the candidate name manually.
  return `https://www.uibm.gov.it/bancadati/`;
}

/**
 * Build a TmPrescreenRecord for a candidate name.
 */
function buildTmPrescreenRecord(name: string): TmPrescreenRecord {
  return {
    euipo_url: buildEuipoUrl(name),
    wipo_url: buildWipoUrl(name),
    uibm_url: buildUibmUrl(name),
    classes: [...TM_CLASSES],
    operator_result: null,
  };
}

// ---------------------------------------------------------------------------
// Sidecar event builders
// ---------------------------------------------------------------------------

function makeCandidateRecord(name: string): CandidateRecord {
  return {
    name,
    pattern: 'A', // placeholder — CLI does not carry per-name pattern metadata
    domain_string: null,  // no domain checking for product line names
    provenance: null,
    scores: null,         // scores live in the candidate markdown table, not the sidecar
  };
}

function makeGeneratedEvent(name: string): SidecarEvent {
  return {
    schema_version: 'v1',
    event_id: generateEventId(),
    business: BUSINESS,
    round: ROUND,
    run_date: RUN_DATE,
    stage: 'generated',
    candidate: makeCandidateRecord(name),
    rdap: null,
    model_output: null,
    timestamp: new Date().toISOString(),
  };
}

function makeTmPrescreenedEvent(name: string, tmRecord: TmPrescreenRecord): SidecarEvent {
  return {
    schema_version: 'v1',
    event_id: generateEventId(),
    business: BUSINESS,
    round: ROUND,
    run_date: RUN_DATE,
    stage: 'tm_prescreened',
    candidate: makeCandidateRecord(name),
    rdap: null,
    model_output: null,
    tm_prescreen: tmRecord,
    timestamp: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Output formatter
// ---------------------------------------------------------------------------

/**
 * Format the TM direction output block for a single candidate.
 * Produces plain text — no colour codes, safe for piping to a file.
 */
function formatTmDirectionBlock(
  index: number,
  name: string,
  tmRecord: TmPrescreenRecord,
): string {
  const classesStr = tmRecord.classes.map((c) => `Class ${c}`).join(', ');
  const lines: string[] = [
    `--- ${index}. ${name} ---`,
    `Compound: ${BUSINESS} ${name}`,
    `TM classes: ${classesStr}`,
    ``,
    `EUIPO (EU trademark register — eTMview):`,
    `  ${tmRecord.euipo_url}`,
    `  Note: Check "Word" search for exact match + phonetic near-matches in ${classesStr}.`,
    ``,
    `WIPO Global Brand Database (cross-jurisdictional):`,
    `  ${tmRecord.wipo_url}`,
    `  Note: Search includes EU, IT, FR, DE marks. Look for word mark conflicts in ${classesStr}.`,
    ``,
    `UIBM (Italian national trademark register):`,
    `  ${tmRecord.uibm_url}`,
    `  Manual step: Navigate to the URL, enter "${name}" in the word mark search field, filter by ${classesStr}.`,
    ``,
    `Operator result: [ ] Clear  [ ] Conflict  [ ] Pending`,
    ``,
  ];
  return lines.join('\n');
}

/**
 * Format the full output for all candidates.
 */
function formatTmDirectionOutput(
  names: string[],
  tmRecords: TmPrescreenRecord[],
): string {
  const header = [
    `TM Pre-Screen Direction — ${BUSINESS} Naming Pipeline`,
    `Run date: ${RUN_DATE}  |  Round: ${ROUND}  |  Business: ${BUSINESS}`,
    `Candidates: ${names.length}  |  Classes checked: ${TM_CLASSES.map((c) => `Class ${c}`).join(', ')}`,
    ``,
    `IMPORTANT: This document provides search direction only. No trademark searches`,
    `have been performed automatically. The operator must visit each URL and record`,
    `the result in the "Operator result" field below.`,
    ``,
    `A clear result in the target class does not guarantee no conflict — seek`,
    `professional IP advice if any near-matches are found.`,
    ``,
    `====================================================================`,
    ``,
  ].join('\n');

  const blocks = names.map((name, i) =>
    formatTmDirectionBlock(i + 1, name, tmRecords[i]!)
  );

  const footer = [
    `====================================================================`,
    ``,
    `Next step: After completing searches, update the shortlist artifact`,
    `(naming-shortlist-${RUN_DATE}.user.md) with TM pre-screen results.`,
    ``,
    `Nice Classification classes searched: ${TM_CLASSES.map((c) => `Class ${c}`).join(', ')}`,
    `(See https://www.wipo.int/classifications/nice/en/ for class descriptions)`,
    ``,
  ].join('\n');

  return header + blocks.join('\n') + footer;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const rl = readline.createInterface({
    input: process.stdin,
    crlfDelay: Infinity,
  });

  const names: string[] = [];
  for await (const line of rl) {
    const trimmed = line.trim();
    if (trimmed.length > 0) {
      names.push(trimmed);
    }
  }

  if (names.length === 0) {
    process.stderr.write('tm-prescreen-cli: no names received on stdin\n');
    process.exit(1);
  }

  process.stderr.write(
    `tm-prescreen-cli: generating TM direction for ${names.length} candidates...\n`
  );

  // Write 'generated' sidecar events before processing
  for (const name of names) {
    const event = makeGeneratedEvent(name);
    writeSidecarEvent(event, SIDECAR_DIR, { mkdirIfMissing: true });
  }

  // Build TM pre-screen records and write 'tm_prescreened' sidecar events
  const tmRecords: TmPrescreenRecord[] = [];
  for (const name of names) {
    const tmRecord = buildTmPrescreenRecord(name);
    tmRecords.push(tmRecord);
    const event = makeTmPrescreenedEvent(name, tmRecord);
    writeSidecarEvent(event, SIDECAR_DIR, { mkdirIfMissing: true });
  }

  // Output TM direction to stdout
  const output = formatTmDirectionOutput(names, tmRecords);
  process.stdout.write(output);

  process.stderr.write(
    `tm-prescreen-cli: done. ${names.length} candidates processed. ` +
    `Sidecar events written to ${SIDECAR_DIR}.\n`
  );
}

main().catch((err: unknown) => {
  process.stderr.write(`tm-prescreen-cli: fatal error: ${String(err)}\n`);
  process.exit(1);
});
