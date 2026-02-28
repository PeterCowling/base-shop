import type { RdapResult, RdapStatus } from './rdap-types.js';

const RDAP_BASE_URL = 'https://rdap.verisign.com/com/v1/domain';

function calcBackoffMs(
  attempt: number,
  baseDelayMs: number,
  maxDelayMs: number,
): number {
  // Exponential backoff with full jitter
  const exponential = Math.min(baseDelayMs * Math.pow(2, attempt), maxDelayMs);
  return Math.floor(Math.random() * exponential);
}

export async function rdapCheckWithRetry(
  name: string,
  options?: {
    maxRetries?: number;
    baseDelayMs?: number;
    maxDelayMs?: number;
    fetchFn?: typeof fetch;
    sleepFn?: (ms: number) => Promise<void>;
  },
): Promise<RdapResult> {
  const maxRetries = options?.maxRetries ?? 3;
  const baseDelayMs = options?.baseDelayMs ?? 1000;
  const maxDelayMs = options?.maxDelayMs ?? 8000;
  const fetchFn = options?.fetchFn ?? globalThis.fetch;
  const sleepFn =
    options?.sleepFn ?? ((ms: number) => new Promise((resolve) => setTimeout(resolve, ms)));

  const url = `${RDAP_BASE_URL}/${name}.com`;
  const startMs = Date.now();
  let retries = 0;
  let lastStatusCode: number | null = null;

  while (true) {
    let statusCode: number | null = null;

    try {
      const response = await fetchFn(url);
      statusCode = response.status;
      lastStatusCode = statusCode;

      if (statusCode === 200) {
        return {
          name,
          status: 'taken',
          statusCode,
          unknownReason: null,
          retries,
          latencyMs: Date.now() - startMs,
          terminalClassification: 'taken',
        };
      }

      if (statusCode === 404) {
        return {
          name,
          status: 'available',
          statusCode,
          unknownReason: null,
          retries,
          latencyMs: Date.now() - startMs,
          terminalClassification: 'available',
        };
      }

      if (statusCode === 429) {
        // Rate-limited — backoff and retry if we have attempts left
        if (retries < maxRetries) {
          const delay = calcBackoffMs(retries, baseDelayMs, maxDelayMs);
          await sleepFn(delay);
          retries++;
          continue;
        }
        // Exhausted retries on throttle
        const finalStatus: RdapStatus = 'unknown';
        return {
          name,
          status: finalStatus,
          statusCode,
          unknownReason: 'rate_limited',
          retries,
          latencyMs: Date.now() - startMs,
          terminalClassification: finalStatus,
        };
      }

      // Any other 4xx or 5xx — unexpected, return unknown immediately (no retry)
      const finalStatus: RdapStatus = 'unknown';
      return {
        name,
        status: finalStatus,
        statusCode,
        unknownReason: 'unexpected_status',
        retries,
        latencyMs: Date.now() - startMs,
        terminalClassification: finalStatus,
      };
    } catch (_err) {
      // Network error / timeout (statusCode remains null)
      if (retries < maxRetries) {
        const delay = calcBackoffMs(retries, baseDelayMs, maxDelayMs);
        await sleepFn(delay);
        retries++;
        continue;
      }

      // Exhausted retries on connection error
      const finalStatus: RdapStatus = 'unknown';
      return {
        name,
        status: finalStatus,
        statusCode: lastStatusCode,
        unknownReason: 'connection_error',
        retries,
        latencyMs: Date.now() - startMs,
        terminalClassification: finalStatus,
      };
    }
  }
}
