/**
 * File-backed lock store for email processing locks.
 *
 * Each lock is a JSON file at <dataDir>/<messageId>.json.
 * Shape: { lockedAt: number, owner: string }
 *
 * Uses fs.writeFileSync with flag "wx" for atomic creation (O_EXCL):
 * if the file already exists the OS throws EEXIST — this prevents
 * two concurrent acquire calls from both succeeding (TOCTOU-safe
 * within a single Node.js process).
 *
 * LOCK_STORE_PATH env var overrides the default dataDir so tests
 * can redirect writes to a temp directory.
 */

import * as fs from "node:fs";
import * as nodePath from "node:path";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface LockEntry {
  lockedAt: number;
  owner: string;
}

export interface LockStore {
  /** Create a lock file. Returns false if the lock already exists (EEXIST). */
  acquire(messageId: string, owner: string): boolean;
  /** Delete the lock file. Silently ignores missing-file errors. */
  release(messageId: string): void;
  /** Read and parse the lock file. Returns null on any error (missing / corrupt). */
  get(messageId: string): LockEntry | null;
  /**
   * Returns true when the lock file exists and its lockedAt timestamp is
   * older than timeoutMs.  Returns false when the lock file is absent
   * (absence means unlocked, not stale).
   */
  isStale(messageId: string, timeoutMs: number): boolean;
  /** Returns the list of messageIds that currently have lock files. */
  list(): string[];
}

// ---------------------------------------------------------------------------
// Default path resolution
// ---------------------------------------------------------------------------

function resolveDefaultDataDir(): string {
  if (process.env.LOCK_STORE_PATH) {
    return process.env.LOCK_STORE_PATH;
  }
  // Same candidate-directory strategy as resolveDefaultAuditLogPath in gmail.ts.
  const fromPackageRoot = nodePath.join(process.cwd(), "data", "locks");
  const fromMonorepoRoot = nodePath.join(
    process.cwd(),
    "packages",
    "mcp-server",
    "data",
    "locks"
  );
  // Prefer the path whose parent data/ dir already exists.
  if (fs.existsSync(nodePath.dirname(fromPackageRoot))) {
    return fromPackageRoot;
  }
  return fromMonorepoRoot;
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export function createLockStore(dataDir?: string): LockStore {
  const dir = dataDir ?? resolveDefaultDataDir();

  // Ensure the lock directory exists on construction.
  fs.mkdirSync(dir, { recursive: true });

  function lockPath(messageId: string): string {
    return nodePath.join(dir, `${messageId}.json`);
  }

  return {
    acquire(messageId: string, owner: string): boolean {
      const entry: LockEntry = { lockedAt: Date.now(), owner };
      try {
        fs.writeFileSync(lockPath(messageId), JSON.stringify(entry), { flag: "wx" });
        return true;
      } catch (err) {
        const code = (err as NodeJS.ErrnoException).code;
        if (code === "EEXIST") {
          // Lock already held by another (or same) process.
          return false;
        }
        // Unexpected filesystem error — re-throw so the caller can handle it.
        throw err;
      }
    },

    release(messageId: string): void {
      try {
        fs.unlinkSync(lockPath(messageId));
      } catch {
        // File already gone — silently ignore.
      }
    },

    get(messageId: string): LockEntry | null {
      try {
        const raw = fs.readFileSync(lockPath(messageId), "utf-8");
        return JSON.parse(raw) as LockEntry;
      } catch {
        return null;
      }
    },

    isStale(messageId: string, timeoutMs: number): boolean {
      const entry = this.get(messageId);
      if (entry === null) {
        // No lock file means the email is unlocked, not stale.
        return false;
      }
      return Date.now() - entry.lockedAt > timeoutMs;
    },

    list(): string[] {
      try {
        return fs
          .readdirSync(dir)
          .filter(name => name.endsWith(".json"))
          .map(name => name.slice(0, -5)); // strip .json
      } catch {
        return [];
      }
    },
  };
}
