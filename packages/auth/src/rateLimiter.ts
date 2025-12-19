/* istanbul ignore file */
import { RateLimiterMemory } from "rate-limiter-flexible";

type KvNamespace = {
  get(key: string, options?: { type?: "text" | "json" }): Promise<string | null>;
  put(
    key: string,
    value: string,
    options?: { expirationTtl?: number; expiration?: number }
  ): Promise<void>;
};

export interface RateLimiter {
  consume(key: string): Promise<void>;
}

interface RateLimiterOptions {
  points: number;
  duration: number; // seconds
  provider?: "kv" | "memory" | "redis";
  kvBinding?: KvNamespace;
}

class KvRateLimiter implements RateLimiter {
  constructor(
    private kv: KvNamespace,
    private points: number,
    private duration: number
  ) {}

  async consume(key: string): Promise<void> {
    const now = Date.now();
    const ttlMs = this.duration * 1000;
    const resetAtDefault = now + ttlMs;
    let count = 0;
    let resetAt = resetAtDefault;
    try {
      const raw = await this.kv.get(this.kvKey(key), { type: "text" });
      if (raw) {
        const parsed = JSON.parse(raw) as { count?: number; resetAt?: number };
        if (parsed.resetAt && parsed.resetAt > now) {
          resetAt = parsed.resetAt;
          count = parsed.count ?? 0;
        }
      }
    } catch (err) {
      console.warn("KV rate limiter read failed; falling back to memory", err); // i18n-exempt -- internal diagnostic log
      throw err;
    }

    if (count >= this.points) {
      throw new Error("rate_limit_exceeded"); // i18n-exempt -- internal diagnostic error
    }

    const nextCount = count + 1;
    const expiresInSeconds = Math.max(
      1,
      Math.ceil((resetAt - now) / 1000)
    );
    try {
      await this.kv.put(
        this.kvKey(key),
        JSON.stringify({ count: nextCount, resetAt }),
        { expirationTtl: expiresInSeconds }
      );
    } catch (err) {
      console.warn("KV rate limiter write failed; falling back to memory", err); // i18n-exempt -- internal diagnostic log
      throw err;
    }
  }

  private kvKey(key: string) {
    return `rl:${key}`;
  }
}

class MemoryRateLimiter implements RateLimiter {
  private limiter: RateLimiterMemory;

  constructor(points: number, duration: number) {
    this.limiter = new RateLimiterMemory({ points, duration });
  }

  async consume(key: string): Promise<void> {
    await this.limiter.consume(key);
  }
}

/** Create a rate limiter choosing KV when requested and available, otherwise memory */
export function createRateLimiter(options: RateLimiterOptions): RateLimiter {
  const provider =
    options.provider ??
    (process.env.RATE_LIMIT_STORE_PROVIDER as RateLimiterOptions["provider"]);

  if (provider === "kv") {
    const kv =
      options.kvBinding ??
      ((globalThis as Record<string, unknown>).LOGIN_RATE_LIMIT_KV as
        | KvNamespace
        | undefined);
    if (kv) {
      try {
        return new KvRateLimiter(kv, options.points, options.duration);
      } catch (err) {
        console.warn("Failed to initialize KV rate limiter; using memory", err); // i18n-exempt -- internal diagnostic log
      }
    } else {
      console.warn(
        "RATE_LIMIT_STORE_PROVIDER=kv but LOGIN_RATE_LIMIT_KV binding missing; using memory"
      );
    }
  }

  return new MemoryRateLimiter(options.points, options.duration);
}
