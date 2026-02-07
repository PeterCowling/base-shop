import "server-only";

import { promises as fs } from "fs";

export type FileLockOptions = { timeoutMs?: number; staleMs?: number };

export async function acquireLock(
  lockFile: string,
  { timeoutMs = 5000, staleMs = 60_000 }: FileLockOptions = {},
): Promise<fs.FileHandle> {
  const start = Date.now();
  while (true) {
    try {
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- COM-UPL: lock path validated by caller
      return await fs.open(lockFile, "wx");
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== "EEXIST") throw err;
      const elapsed = Date.now() - start;
      if (elapsed >= timeoutMs) {
        // eslint-disable-next-line security/detect-non-literal-fs-filename -- COM-UPL: lock path validated by caller
        const stat = await fs.stat(lockFile).catch(() => undefined);
        const isStale =
          typeof stat?.mtimeMs === "number" && Date.now() - stat.mtimeMs > staleMs;
        if (isStale) {
          // eslint-disable-next-line security/detect-non-literal-fs-filename -- COM-UPL: lock path validated by caller
          await fs.unlink(lockFile).catch(() => {});
          continue;
        }
        throw new Error(
          `Timed out acquiring product import lock ${lockFile} after ${timeoutMs}ms`,
        ); // i18n-exempt -- developer error message
      }
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  }
}

