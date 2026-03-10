import { rdapCheckWithRetry } from './rdap-retry.js';
import type { RdapBatchResult, RdapResult } from './rdap-types.js';

/**
 * Check a batch of domain names (without .com) against the RDAP registry.
 *
 * Defaults to sequential (concurrency: 1) to avoid throttling.
 */
export async function rdapBatchCheck(
  names: string[],
  options?: {
    concurrency?: number;
    delayBetweenMs?: number;
    fetchFn?: typeof fetch;
    sleepFn?: (ms: number) => Promise<void>;
  },
): Promise<RdapBatchResult> {
  const concurrency = options?.concurrency ?? 1;
  const delayBetweenMs = options?.delayBetweenMs ?? 0;
  const fetchFn = options?.fetchFn;
  const sleepFn =
    options?.sleepFn ?? ((ms: number) => new Promise((resolve) => setTimeout(resolve, ms)));

  const checkedAt = new Date().toISOString();
  const batchStartMs = Date.now();
  const results: RdapResult[] = [];

  if (concurrency <= 1) {
    // Sequential execution
    for (let i = 0; i < names.length; i++) {
      const result = await rdapCheckWithRetry(names[i], { fetchFn, sleepFn });
      results.push(result);

      if (delayBetweenMs > 0 && i < names.length - 1) {
        await sleepFn(delayBetweenMs);
      }
    }
  } else {
    // Bounded concurrent execution
    let index = 0;

    async function worker(): Promise<void> {
      while (index < names.length) {
        const nameIndex = index++;
        const name = names[nameIndex];
        if (name === undefined) break;
        const result = await rdapCheckWithRetry(name, { fetchFn, sleepFn });
        results[nameIndex] = result;
      }
    }

    const workers = Array.from({ length: Math.min(concurrency, names.length) }, worker);
    await Promise.all(workers);
  }

  return {
    results,
    checkedAt,
    totalMs: Date.now() - batchStartMs,
  };
}

/**
 * Format a single RDAP result as a legacy artifact line.
 *
 * The status column is padded to 10 characters (left-aligned), followed by
 * a space and then the name. This matches the observed HEAD R6 format:
 *   AVAILABLE  Wornset    (9 + 2 spaces)
 *   TAKEN      Tenura     (5 + 6 spaces)
 *   UNKNOWN(000) Collocata (but ERROR(000) → UNKNOWN(000), 10 + 1 space)
 */
export function formatRdapLegacyLine(result: RdapResult): string {
  let statusToken: string;

  if (result.status === 'available') {
    statusToken = 'AVAILABLE';
  } else if (result.status === 'taken') {
    statusToken = 'TAKEN';
  } else {
    // unknown — include the reason code if available
    const code = result.unknownReason === 'connection_error' ? '000'
      : result.statusCode !== null ? String(result.statusCode).padStart(3, '0')
      : '???';
    statusToken = `UNKNOWN(${code})`;
  }

  // Pad status token to 10 characters (left-aligned) then append a space + name
  const paddedStatus = statusToken.padEnd(10, ' ');
  return `${paddedStatus} ${result.name}`;
}

/**
 * Format a full batch result as legacy RDAP text artifact content.
 * One line per result, terminated with a trailing newline.
 */
export function formatRdapLegacyText(batchResult: RdapBatchResult): string {
  return batchResult.results.map(formatRdapLegacyLine).join('\n') + '\n';
}
