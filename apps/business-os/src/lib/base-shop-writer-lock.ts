import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function getGitCommonDir(repoRoot: string): Promise<string> {
  const { stdout } = await execFileAsync(
    "git",
    // i18n-exempt -- BOS-33 git plumbing args (non-UI) [ttl=2026-03-31]
    ["rev-parse", "--path-format=absolute", "--git-common-dir"],
    { cwd: repoRoot }
  );
  return stdout.trim();
}

function parseWriterLockToken(meta: string): string | null {
  for (const line of meta.split("\n")) {
    if (line.startsWith("token=")) {
      return line.slice("token=".length).trim();
    }
  }
  return null;
}

export async function withBaseShopWriterLock<T>(
  repoRoot: string,
  note: string,
  action: () => Promise<T>
): Promise<T> {
  const lockScript = path.join(repoRoot, "scripts/git/writer-lock.sh");

  // In tests / standalone environments, we may not have the Base-Shop writer lock script.
  if (!(await fileExists(lockScript))) {
    return action();
  }

  await execFileAsync(lockScript, ["acquire", "--wait"], {
    cwd: repoRoot,
    env: { ...process.env, BASESHOP_WRITER_LOCK_NOTE: note },
  });

  const commonDir = await getGitCommonDir(repoRoot);
  const lockMeta = path.join(commonDir, "base-shop-writer-lock", "meta");
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- BOS-33 reading lock metadata path derived from git common dir [ttl=2026-03-31]
  const meta = await fs.readFile(lockMeta, "utf-8");
  const token = parseWriterLockToken(meta);

  if (!token) {
    // i18n-exempt -- BOS-33 internal writer lock error [ttl=2026-03-31]
    throw new Error("Writer lock acquired but token missing");
  }

  const previousToken = process.env.BASESHOP_WRITER_LOCK_TOKEN;
  process.env.BASESHOP_WRITER_LOCK_TOKEN = token;

  try {
    return await action();
  } finally {
    try {
      await execFileAsync(lockScript, ["release"], { cwd: repoRoot });
    } catch {
      // Ignore release failures; lock may have been released externally.
    }

    if (previousToken === undefined) {
      delete process.env.BASESHOP_WRITER_LOCK_TOKEN;
    } else {
      process.env.BASESHOP_WRITER_LOCK_TOKEN = previousToken;
    }
  }
}
