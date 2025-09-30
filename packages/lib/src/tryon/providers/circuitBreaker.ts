import { t } from "../i18n";

export type BreakerState = 'closed' | 'open' | 'half-open';

interface Entry {
  state: BreakerState;
  failures: number;
  nextTryAt: number; // epoch ms when OPEN may transition to HALF-OPEN
  inHalfOpen: boolean;
}

export interface Breaker {
  exec<T>(key: string, fn: () => Promise<T>): Promise<T>;
}

export function createBreaker(opts: { timeoutMs: number; failureThreshold: number; coolOffMs: number }): Breaker {
  const { timeoutMs, failureThreshold, coolOffMs } = opts;
  const table = new Map<string, Entry>();

  function now() { return Date.now(); }

  function getEntry(key: string): Entry {
    const e = table.get(key);
    if (e) return e;
    const fresh: Entry = { state: 'closed', failures: 0, nextTryAt: 0, inHalfOpen: false };
    table.set(key, fresh);
    return fresh;
  }

  async function withTimeout<T>(p: Promise<T>): Promise<T> {
    if (!timeoutMs || timeoutMs <= 0) return p;
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(t('tryon.circuitBreaker.timeout'))), timeoutMs);
      p.then((v) => { clearTimeout(timer); resolve(v); }, (e) => { clearTimeout(timer); reject(e); });
    });
  }

  async function runOnce<T>(fn: () => Promise<T>): Promise<T> {
    return withTimeout(Promise.resolve().then(fn));
  }

  return {
    async exec<T>(key: string, fn: () => Promise<T>): Promise<T> {
      const e = getEntry(key);
      const nowMs = now();

      if (e.state === 'open') {
        if (nowMs < e.nextTryAt) {
          throw new Error(t('tryon.circuitBreaker.open'));
        } else {
          e.state = 'half-open';
          e.inHalfOpen = false; // allow a single trial
        }
      }

      if (e.state === 'half-open') {
        if (e.inHalfOpen) {
          throw new Error(t('tryon.circuitBreaker.halfOpen'));
        }
        e.inHalfOpen = true;
      }

      try {
        const result = await runOnce(fn);
        // success: reset
        e.failures = 0;
        e.state = 'closed';
        e.nextTryAt = 0;
        e.inHalfOpen = false;
        return result;
      } catch (err) {
        e.failures += 1;
        if (e.failures >= failureThreshold || e.state === 'half-open') {
          e.state = 'open';
          e.nextTryAt = nowMs + coolOffMs;
          e.inHalfOpen = false;
        }
        throw err;
      }
    },
  };
}
