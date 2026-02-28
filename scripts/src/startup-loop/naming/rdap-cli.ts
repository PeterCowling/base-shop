/**
 * rdap-cli.ts
 *
 * Reads a newline-separated list of brand names from stdin (no .com suffix),
 * runs RDAP batch check, outputs legacy text format to stdout, and writes
 * sidecar events (generated + rdap_checked) for each name.
 *
 * Usage:
 *   echo -e "Duranta\nTenanda" | npx tsx scripts/src/startup-loop/naming/rdap-cli.ts
 */

import * as readline from 'node:readline';

import {
  type CandidateRecord,
  generateEventId,
  type SidecarEvent,
  writeSidecarEvent,
} from './event-log-writer.js';
import { formatRdapLegacyText, rdapBatchCheck } from './rdap-client.js';

const SIDECAR_DIR =
  '/Users/petercowling/base-shop/docs/business-os/strategy/HEAD/naming-sidecars';

const RUN_DATE = '2026-02-26';
const ROUND = 7;
const BUSINESS = 'HEAD';

function makeCandidateRecord(name: string): CandidateRecord {
  return {
    name,
    pattern: 'A', // placeholder — CLI does not carry per-name pattern metadata
    domain_string: `${name.toLowerCase()}.com`,
    provenance: null,
    scores: null,
  };
}

async function main(): Promise<void> {
  // Read names from stdin
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
    process.stderr.write('rdap-cli: no names received on stdin\n');
    process.exit(1);
  }

  process.stderr.write(`rdap-cli: checking ${names.length} names via RDAP...\n`);

  // Write 'generated' sidecar events before RDAP check
  for (const name of names) {
    const event: SidecarEvent = {
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
    writeSidecarEvent(event, SIDECAR_DIR, { mkdirIfMissing: true });
  }

  // Run RDAP batch check with 200ms delay between requests (rate limiting)
  const batchResult = await rdapBatchCheck(names, { delayBetweenMs: 200 });

  // Write 'rdap_checked' sidecar events after RDAP check
  for (const result of batchResult.results) {
    const event: SidecarEvent = {
      schema_version: 'v1',
      event_id: generateEventId(),
      business: BUSINESS,
      round: ROUND,
      run_date: RUN_DATE,
      stage: 'rdap_checked',
      candidate: makeCandidateRecord(result.name),
      rdap: {
        status: result.status,
        statusCode: result.statusCode,
        retries: result.retries,
        latencyMs: result.latencyMs,
      },
      model_output: null,
      timestamp: new Date().toISOString(),
    };
    writeSidecarEvent(event, SIDECAR_DIR, { mkdirIfMissing: true });
  }

  // Output legacy text format to stdout
  process.stdout.write(formatRdapLegacyText(batchResult));

  process.stderr.write(
    `rdap-cli: done. ${batchResult.results.length} results in ${batchResult.totalMs}ms\n`,
  );
}

main().catch((err: unknown) => {
  process.stderr.write(`rdap-cli: fatal error: ${String(err)}\n`);
  process.exit(1);
});
