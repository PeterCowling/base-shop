import { promises as fs } from "node:fs";
import path from "node:path";

import { growthLedgerSchema } from "./schema";
import { canonicalSerializeJson } from "./serialize";
import type { GrowthLedger } from "./types";

const DEFAULT_DATA_ROOT = path.join(process.cwd(), "data", "shops");

export interface GrowthLedgerStoreOptions {
  dataRoot?: string;
  fileOps?: GrowthLedgerFileOps;
}

export interface GrowthLedgerUpdateInput {
  shopId: string;
  expectedRevision?: number;
  computeNext: (current: GrowthLedger | null) => GrowthLedger;
  options?: GrowthLedgerStoreOptions;
}

export interface GrowthLedgerUpdateResult {
  changed: boolean;
  ledger: GrowthLedger;
}

export interface GrowthLedgerFileOps {
  mkdir: typeof fs.mkdir;
  readFile: typeof fs.readFile;
  rename: typeof fs.rename;
  unlink: typeof fs.unlink;
  writeFile: typeof fs.writeFile;
}

const DEFAULT_FILE_OPS: GrowthLedgerFileOps = {
  mkdir: fs.mkdir.bind(fs),
  readFile: fs.readFile.bind(fs),
  rename: fs.rename.bind(fs),
  unlink: fs.unlink.bind(fs),
  writeFile: fs.writeFile.bind(fs),
};

export class GrowthLedgerConflictError extends Error {
  constructor(
    public readonly expectedRevision: number,
    public readonly actualRevision: number,
  ) {
    super(
      `Growth ledger CAS mismatch: expected revision ${expectedRevision}, got ${actualRevision}.`,
    );
    this.name = "GrowthLedgerConflictError";
  }
}

export function growthLedgerPath(shopId: string, dataRoot = DEFAULT_DATA_ROOT): string {
  return path.join(dataRoot, shopId, "growth-ledger.json");
}

function resolveOptions(
  options: GrowthLedgerStoreOptions = {},
): Required<GrowthLedgerStoreOptions> {
  return {
    dataRoot: options.dataRoot ?? DEFAULT_DATA_ROOT,
    fileOps: options.fileOps ?? DEFAULT_FILE_OPS,
  };
}

function isNotFoundError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "ENOENT"
  );
}

export async function readGrowthLedger(
  shopId: string,
  options: GrowthLedgerStoreOptions = {},
): Promise<GrowthLedger | null> {
  const resolved = resolveOptions(options);
  const filePath = growthLedgerPath(shopId, resolved.dataRoot);

  let content: string;
  try {
    content = await resolved.fileOps.readFile(filePath, "utf8");
  } catch (error) {
    if (isNotFoundError(error)) {
      return null;
    }
    throw error;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch (error) {
    throw new Error(
      `Growth ledger at ${filePath} is not valid JSON: ${String(error)}`,
    );
  }

  const validated = growthLedgerSchema.safeParse(parsed);
  if (!validated.success) {
    const details = validated.error.issues.map((issue) => issue.message).join("; ");
    throw new Error(`Growth ledger at ${filePath} failed schema validation: ${details}`);
  }

  return validated.data;
}

export async function writeGrowthLedger(
  shopId: string,
  ledger: GrowthLedger,
  options: GrowthLedgerStoreOptions = {},
): Promise<void> {
  const resolved = resolveOptions(options);
  const filePath = growthLedgerPath(shopId, resolved.dataRoot);
  const directory = path.dirname(filePath);
  await resolved.fileOps.mkdir(directory, { recursive: true });

  const tmpPath = `${filePath}.tmp-${process.pid}-${Date.now()}`;
  const serialized = canonicalSerializeJson(ledger);

  try {
    await resolved.fileOps.writeFile(tmpPath, serialized, "utf8");
    await resolved.fileOps.rename(tmpPath, filePath);
  } catch (error) {
    try {
      await resolved.fileOps.unlink(tmpPath);
    } catch (cleanupError) {
      if (!isNotFoundError(cleanupError)) {
        throw cleanupError;
      }
    }
    throw error;
  }
}

function applyRevisionRules(current: GrowthLedger | null, next: GrowthLedger): GrowthLedger {
  if (!current) {
    return next;
  }

  const expectedNextRevision = current.ledger_revision + 1;
  if (next.ledger_revision === expectedNextRevision) {
    return next;
  }

  return {
    ...next,
    ledger_revision: expectedNextRevision,
  };
}

export async function updateGrowthLedger(
  input: GrowthLedgerUpdateInput,
): Promise<GrowthLedgerUpdateResult> {
  const { shopId, expectedRevision, computeNext } = input;
  const options = input.options ?? {};
  const current = await readGrowthLedger(shopId, options);

  if (expectedRevision !== undefined) {
    const actualRevision = current?.ledger_revision ?? 0;
    if (expectedRevision !== actualRevision) {
      throw new GrowthLedgerConflictError(expectedRevision, actualRevision);
    }
  }

  const nextRaw = computeNext(current);
  const currentSerialized = current ? canonicalSerializeJson(current) : null;
  const nextRawSerialized = canonicalSerializeJson(nextRaw);
  if (current && currentSerialized === nextRawSerialized) {
    return { changed: false, ledger: current };
  }

  const next = applyRevisionRules(current, nextRaw);
  const nextSerialized = canonicalSerializeJson(next);
  if (current && currentSerialized === nextSerialized) {
    return { changed: false, ledger: current };
  }

  await writeGrowthLedger(shopId, next, options);
  return { changed: true, ledger: next };
}
