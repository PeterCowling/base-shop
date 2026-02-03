/**
 * Collision-proof ID allocator
 * MVP-C2: Atomic counter-based ID allocation
 *
 * Replaces scan-based allocator with atomic counter increments under repo lock.
 * Ensures no duplicate IDs even under concurrent load.
 */

import fs from "node:fs/promises";

import type { RepoLock } from "./RepoLock";

/**
 * Counter storage structure
 * { business: { type: counter } }
 */
interface Counters {
  [business: string]: {
    [type: string]: number;
  };
}

/**
 * Atomic ID allocator using file-based counters
 *
 * Usage:
 * ```ts
 * const lock = new RepoLock(lockDir);
 * const allocator = new IDAllocator(countersFile, lock);
 *
 * const cardId = await allocator.allocate("BRIK", "card"); // "BRIK-001"
 * const ideaId = await allocator.allocate("BRIK", "idea"); // "BRIK-OPP-001"
 * ```
 */
export class IDAllocator {
  private countersFile: string;
  private lock: RepoLock;

  constructor(countersFile: string, lock: RepoLock) {
    this.countersFile = countersFile;
    this.lock = lock;
  }

  /**
   * Allocate next ID for business and type
   *
   * Thread-safe: Uses repo lock to serialize counter updates
   */
  async allocate(business: string, type: string): Promise<string> {
    return this.lock.withLock(
      { userId: "system", action: "allocate-id" },
      async () => {
        // Read current counters
        const counters = await this.readCounters();

        // Get current counter (or 0 if not exists)
        const currentCounter = counters[business]?.[type] ?? 0;

        // Increment
        const nextCounter = currentCounter + 1;

        // Update counters
        if (!counters[business]) {
          counters[business] = {};
        }
        counters[business][type] = nextCounter;

        // Write counters atomically
        await this.writeCounters(counters);

        // Format ID
        return this.formatId(business, type, nextCounter);
      }
    );
  }

  /**
   * Get current counter value (without incrementing)
   */
  async getCurrentCounter(business: string, type: string): Promise<number> {
    const counters = await this.readCounters();
    return counters[business]?.[type] ?? 0;
  }

  /**
   * Set counter to specific value
   * Useful for migration/seeding from existing IDs
   */
  async setCounter(
    business: string,
    type: string,
    value: number
  ): Promise<void> {
    return this.lock.withLock(
      { userId: "system", action: "set-counter" },
      async () => {
        const counters = await this.readCounters();

        if (!counters[business]) {
          counters[business] = {};
        }
        counters[business][type] = value;

        await this.writeCounters(counters);
      }
    );
  }

  /**
   * Read counters from file
   */
  private async readCounters(): Promise<Counters> {
    try {
      const content = await fs.readFile(this.countersFile, "utf-8");
      return JSON.parse(content) as Counters;
    } catch (error) {
      // File doesn't exist or is corrupt - return empty counters
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        return {};
      }
      // Corrupt file - return empty counters
      return {};
    }
  }

  /**
   * Write counters to file atomically
   */
  private async writeCounters(counters: Counters): Promise<void> {
    const content = JSON.stringify(counters, null, 2);

    // Ensure directory exists
    const dir = this.countersFile.substring(
      0,
      this.countersFile.lastIndexOf("/")
    );
    await fs.mkdir(dir, { recursive: true });

    // Write atomically using temp file + rename
    const tempFile = `${this.countersFile}.tmp`;
    await fs.writeFile(tempFile, content, "utf-8");
    await fs.rename(tempFile, this.countersFile);
  }

  /**
   * Format ID based on business, type, and counter
   */
  private formatId(business: string, type: string, counter: number): string {
    const paddedNumber = String(counter).padStart(3, "0");

    if (type === "idea") {
      // Ideas: BRIK-OPP-001
      return `${business}-OPP-${paddedNumber}`;
    } else {
      // Cards: BRIK-001
      return `${business}-${paddedNumber}`;
    }
  }
}
