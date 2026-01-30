/**
 * File-based repository write lock
 *
 * Provides atomic lock acquisition for serializing git operations.
 * Uses Node.js fs.open('wx') for atomic file creation.
 *
 * MVP-C1: Global repo write lock
 */

import fs from "node:fs/promises";
import path from "node:path";

export interface LockMetadata {
  userId: string;
  action: string;
}

export interface LockData extends LockMetadata {
  pid: number;
  timestamp: number;
  lockId: string;
}

export interface LockResult {
  success: boolean;
  lockId?: string;
  errorKey?: string;
  errorDetails?: string;
}

export interface LockOptions {
  ttlMs?: number; // Lock TTL in milliseconds (default: 30000 = 30s)
}

const DEFAULT_TTL_MS = 30000; // 30 seconds

/**
 * File-based mutex for repository write operations
 *
 * Usage:
 * ```ts
 * const lock = new RepoLock(lockDir);
 *
 * // Acquire lock
 * const result = await lock.acquire({ userId: "pete", action: "write-card" });
 * if (!result.success) {
 *   throw new Error("Failed to acquire lock");
 * }
 *
 * try {
 *   // Perform git operations
 * } finally {
 *   await lock.release(result.lockId!);
 * }
 * ```
 *
 * Or use withLock helper:
 * ```ts
 * await lock.withLock({ userId: "pete", action: "write-card" }, async () => {
 *   // Perform git operations
 * });
 * ```
 */
export class RepoLock {
  private lockDir: string;
  private lockFile: string;
  private ttlMs: number;

  constructor(lockDir: string, options?: LockOptions) {
    this.lockDir = lockDir;
    this.lockFile = path.join(lockDir, "repo.lock");
    this.ttlMs = options?.ttlMs ?? DEFAULT_TTL_MS;
  }

  /**
   * Acquire lock atomically
   *
   * If lock is already held:
   * - If lock is stale (TTL exceeded and pid dead), force-acquire
   * - Otherwise, return failure with errorKey
   */
  async acquire(metadata: LockMetadata): Promise<LockResult> {
    try {
      // Check if lock file exists
      const lockExists = await this.lockFileExists();

      if (lockExists) {
        // Check if stale
        const staleLockRecovered = await this.tryRecoverStaleLock();

        if (!staleLockRecovered) {
          return {
            success: false,
            errorKey: "businessOs.repoLock.errors.lockHeld",
            // i18n-exempt -- MVP-C1 Phase 0 lock error details [ttl=2026-03-31]
            errorDetails: "Repository lock is currently held by another operation",
          };
        }
      }

      // Generate lock ID
      const lockId = this.generateLockId();
      const lockData: LockData = {
        ...metadata,
        pid: process.pid,
        timestamp: Date.now(),
        lockId,
      };

      // Atomic lock file creation
      await this.createLockFileAtomic(lockData);

      return {
        success: true,
        lockId,
      };
    } catch (error) {
      return {
        success: false,
        errorKey: "businessOs.repoLock.errors.acquireFailed",
        errorDetails: String(error),
      };
    }
  }

  /**
   * Release lock
   *
   * Removes lock file. No-op if lock not held.
   */
  async release(lockId: string): Promise<void> {
    try {
      // Verify lock ownership before release (optional safety check)
      const exists = await this.lockFileExists();
      if (!exists) {
        // Already released - no-op
        return;
      }

      // Read lock data to verify ownership
      try {
        const lockData = await this.readLockData();
        if (lockData?.lockId !== lockId) {
          // Lock has been overtaken or released - no-op
          return;
        }
      } catch {
        // Lock file corrupt or unreadable - remove it anyway
      }

      // Remove lock file
      await fs.rm(this.lockFile, { force: true });
    } catch {
      // Suppress release errors (lock may have been force-acquired)
    }
  }

  /**
   * Execute action under lock
   *
   * Automatically acquires lock, executes action, and releases lock.
   * Lock is released even if action throws.
   */
  async withLock<T>(
    metadata: LockMetadata,
    action: () => Promise<T>
  ): Promise<T> {
    const result = await this.acquire(metadata);

    if (!result.success) {
      // i18n-exempt -- MVP-C1 Phase 0 lock error message [ttl=2026-03-31]
      throw new Error(
        result.errorDetails || "Failed to acquire repository lock"
      );
    }

    try {
      return await action();
    } finally {
      await this.release(result.lockId!);
    }
  }

  /**
   * Check if lock file exists
   */
  private async lockFileExists(): Promise<boolean> {
    try {
      await fs.access(this.lockFile);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Read lock data from lock file
   */
  private async readLockData(): Promise<LockData | null> {
    try {
      const content = await fs.readFile(this.lockFile, "utf-8");
      return JSON.parse(content) as LockData;
    } catch {
      return null;
    }
  }

  /**
   * Try to recover stale lock
   *
   * Returns true if stale lock was recovered (and removed).
   * Returns false if lock is fresh or process is still alive.
   */
  private async tryRecoverStaleLock(): Promise<boolean> {
    const lockData = await this.readLockData();

    if (!lockData) {
      // Lock file corrupt or unreadable - treat as stale
      await fs.rm(this.lockFile, { force: true });
      return true;
    }

    const age = Date.now() - lockData.timestamp;

    // Check if TTL exceeded
    if (age < this.ttlMs) {
      // Lock is fresh
      return false;
    }

    // TTL exceeded - check if process is still alive
    const processAlive = this.isProcessAlive(lockData.pid);

    if (processAlive) {
      // Process is alive but lock is old - respect it (may be long operation)
      return false;
    }

    // Stale lock - remove it
    await fs.rm(this.lockFile, { force: true });
    return true;
  }

  /**
   * Check if process is alive
   *
   * Uses process.kill(pid, 0) which doesn't actually send a signal,
   * but returns whether the process exists.
   */
  private isProcessAlive(pid: number): boolean {
    try {
      process.kill(pid, 0);
      return true;
    } catch {
      // ESRCH = no such process
      return false;
    }
  }

  /**
   * Create lock file atomically
   *
   * Uses fs.open() with 'wx' flag (write + exclusive).
   * Fails if file already exists.
   */
  private async createLockFileAtomic(lockData: LockData): Promise<void> {
    // Ensure lock directory exists
    await fs.mkdir(this.lockDir, { recursive: true });

    // Open file with exclusive flag
    let fd: fs.FileHandle | null = null;
    try {
      fd = await fs.open(this.lockFile, "wx");

      // Write lock data
      const content = JSON.stringify(lockData, null, 2);
      await fd.write(content, 0, "utf-8");
    } finally {
      if (fd) {
        await fd.close();
      }
    }
  }

  /**
   * Generate unique lock ID
   */
  private generateLockId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 10);
    return `lock-${timestamp}-${random}`;
  }
}
