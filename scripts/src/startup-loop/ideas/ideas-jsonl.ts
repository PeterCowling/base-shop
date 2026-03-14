import { randomBytes } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  writeFileSync,
} from "node:fs";
import { basename, dirname, join } from "node:path";

export function atomicWrite(targetPath: string, content: string): void {
  const dir = dirname(targetPath);
  mkdirSync(dir, { recursive: true });
  const suffix = randomBytes(4).toString("hex");
  const tmpPath = join(dir, `.${basename(targetPath)}.tmp.${suffix}`);
  writeFileSync(tmpPath, content, "utf-8");
  renameSync(tmpPath, targetPath);
}

export function readJsonlRecords<T>(
  filePath: string,
  isRecord: (value: unknown) => value is T,
): T[] {
  if (!existsSync(filePath)) {
    return [];
  }

  let raw: string;
  try {
    raw = readFileSync(filePath, "utf-8");
  } catch {
    return [];
  }

  const records: T[] = [];
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (trimmed.length === 0) {
      continue;
    }
    try {
      const record = JSON.parse(trimmed) as unknown;
      if (isRecord(record)) {
        records.push(record);
      }
    } catch {
      // Skip malformed lines to preserve append-only semantics.
    }
  }

  return records;
}

export function appendJsonlRecords<T>(
  filePath: string,
  records: readonly T[],
  dedupeKey: (record: T) => string,
  isRecord: (value: unknown) => value is T,
): number {
  if (records.length === 0) {
    return 0;
  }

  const existingRecords = readJsonlRecords(filePath, isRecord);
  const seenKeys = new Set(existingRecords.map(dedupeKey));
  const newRecords = records.filter((record) => !seenKeys.has(dedupeKey(record)));

  if (newRecords.length === 0) {
    return 0;
  }

  const allRecords = [...existingRecords, ...newRecords];
  const content = allRecords.map((record) => JSON.stringify(record)).join("\n") + "\n";
  atomicWrite(filePath, content);
  return newRecords.length;
}
