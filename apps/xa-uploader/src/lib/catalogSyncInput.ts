import fs from "node:fs/promises";

import { readCsvFile } from "@acme/lib/xa";

export type CatalogSyncInputStatus = {
  exists: boolean;
  rowCount: number;
};

function isErrnoCode(error: unknown, code: string): boolean {
  if (!error || typeof error !== "object") return false;
  return (error as NodeJS.ErrnoException).code === code;
}

export async function getCatalogSyncInputStatus(
  productsCsvPath: string,
): Promise<CatalogSyncInputStatus> {
  try {
    await fs.access(productsCsvPath);
  } catch (error) {
    if (isErrnoCode(error, "ENOENT")) {
      return { exists: false, rowCount: 0 };
    }
    throw error;
  }

  const { rows } = await readCsvFile(productsCsvPath);
  return {
    exists: true,
    rowCount: rows.length,
  };
}
