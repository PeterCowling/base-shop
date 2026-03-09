import { readCsvFile } from "@acme/lib/xa";

import { isErrnoCode } from "./typeGuards";

export type CatalogSyncInputStatus = {
  exists: boolean;
  rowCount: number;
};

export async function getCatalogSyncInputStatus(
  productsCsvPath: string,
): Promise<CatalogSyncInputStatus> {
  try {
    const { rows } = await readCsvFile(productsCsvPath);
    return { exists: true, rowCount: rows.length };
  } catch (error) {
    if (isErrnoCode(error, "ENOENT")) {
      return { exists: false, rowCount: 0 };
    }
    throw error;
  }
}
