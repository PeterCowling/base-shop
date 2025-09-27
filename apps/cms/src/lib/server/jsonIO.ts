import "server-only";

import { promises as fs } from "fs";
import * as path from "path";

const fileLocks = new Map<string, Promise<void>>();

async function withFileLock<T>(file: string, fn: () => Promise<T>): Promise<T> {
  const prev = fileLocks.get(file) ?? Promise.resolve();
  let release: (() => void) | undefined;
  const current = new Promise<void>((resolve) => {
    release = resolve;
  });
  const next = prev.then(() => current);
  fileLocks.set(file, next);
  await prev;
  try {
    return await fn();
  } finally {
    release?.();
    if (fileLocks.get(file) === next) {
      fileLocks.delete(file);
    }
  }
}

export async function readJsonFile<T>(file: string, fallback: T): Promise<T> {
  try {
    // Callers pass validated paths rooted in the workspace data directory
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- ABC-123: file path validated by caller and rooted in data dir
    const buf = await fs.readFile(file, "utf8");
    return JSON.parse(buf) as T;
  } catch {
    return fallback;
  }
}

export async function writeJsonFile(
  file: string,
  value: unknown,
  indent?: number,
): Promise<void> {
  if (value === undefined || value === null || typeof value !== "object") {
    // i18n-exempt -- ABC-123: developer-facing error, not user-visible
    throw new TypeError("Expected value to be a non-null object or array");
  }

  // eslint-disable-next-line security/detect-non-literal-fs-filename -- ABC-123: directory derived from trusted file path
  await fs.mkdir(path.dirname(file), { recursive: true });
  const data = JSON.stringify(value, null, indent ?? 2);

  if (typeof fs.rename === "function") {
    const tmp = `${file}.${process.pid}.${Date.now()}.tmp`;
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- ABC-123: temp file name derived from trusted file
    await fs.writeFile(tmp, data, "utf8");
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- ABC-123: move temp file into trusted destination
    await fs.rename(tmp, file);
  } else {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- ABC-123: write to trusted file destination
    await fs.writeFile(file, data, "utf8");
  }
}

export { withFileLock };
