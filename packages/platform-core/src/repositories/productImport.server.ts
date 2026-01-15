import "server-only";

import { promises as fs } from "fs";
import { ulid } from "ulid";
import type { ProductPublication } from "@acme/types";
import { validateShopName } from "../shops/index";
import { ensureShopDir, shopPath } from "../utils/safeFs";
import { readRepo, writeRepo } from "./products.server";
import { getShopSettings } from "./settings.server";
import { acquireLock } from "./productImport.lock.server";
import { applyProductImportItems } from "./productImport.apply";
import {
  appendProductImport,
  PRODUCT_IMPORT_LOG_FILENAME,
  readAllProductImports,
} from "./productImport.log.server";
import {
  productImportEventSchema,
  productImportRequestSchema,
  type ProductImportActor,
  type ProductImportEvent,
  type ProductImportReport,
} from "../types/productImport";

export { listProductImports } from "./productImport.log.server";

export type ImportProductsResult =
  | {
      ok: true;
      duplicate: false;
      committed: boolean;
      report: ProductImportReport;
      event: ProductImportEvent;
    }
  | {
      ok: true;
      duplicate: true;
      committed: true;
      report: ProductImportReport;
      event: ProductImportEvent;
    }
  | { ok: false; code: string; message: string; details?: unknown };

export async function importProducts(
  shop: string,
  payload: unknown,
  options: { actor?: ProductImportActor } = {},
): Promise<ImportProductsResult> {
  const safeShop = validateShopName(shop);
  const parsed = productImportRequestSchema.safeParse(payload);
  if (!parsed.success) {
    return { ok: false, code: "INVALID_REQUEST", message: parsed.error.message };
  }

  const importedAt = new Date().toISOString();
  const dryRun = Boolean(parsed.data.dryRun);
  const defaultStatus = parsed.data.defaultStatus ?? "draft";

  const lockFile = shopPath(safeShop, `${PRODUCT_IMPORT_LOG_FILENAME}.lock`);
  await ensureShopDir(safeShop);
  const handle = await acquireLock(lockFile);

  try {
    const existingEvents = await readAllProductImports(safeShop);
    const prior = existingEvents.find(
      (e) => e.idempotencyKey === parsed.data.idempotencyKey,
    );
    if (prior) {
      const report: ProductImportReport = {
        shop: safeShop,
        idempotencyKey: prior.idempotencyKey,
        dryRun: false,
        importedAt: prior.importedAt,
        ...(prior.importedBy ? { importedBy: prior.importedBy } : {}),
        ...(prior.note ? { note: prior.note } : {}),
        created: prior.report.created,
        updated: prior.report.updated,
        skipped: prior.report.skipped,
        errors: prior.report.errors,
        results: prior.report.results,
      };
      return { ok: true, duplicate: true, committed: true, report, event: prior };
    }

    const settings = await getShopSettings(safeShop);
    const defaultCurrency = settings.currency ?? "EUR";

    const current = await readRepo<ProductPublication>(safeShop);
    const applied = applyProductImportItems({
      shop: safeShop,
      importedAt,
      defaultCurrency,
      defaultStatus,
      items: parsed.data.items,
      existing: current,
    });
    if (!applied.ok) {
      return applied;
    }

    const committed = !dryRun && applied.errors === 0;
    const report: ProductImportReport = {
      shop: safeShop,
      idempotencyKey: parsed.data.idempotencyKey,
      dryRun,
      importedAt,
      ...(options.actor ? { importedBy: options.actor } : {}),
      ...(parsed.data.note ? { note: parsed.data.note } : {}),
      created: applied.created,
      updated: applied.updated,
      skipped: applied.skipped,
      errors: applied.errors,
      results: applied.results,
    };

    const event: ProductImportEvent = productImportEventSchema.parse({
      id: committed ? ulid() : "dry-run",
      idempotencyKey: parsed.data.idempotencyKey,
      shop: safeShop,
      importedAt,
      ...(options.actor ? { importedBy: options.actor } : {}),
      ...(parsed.data.note ? { note: parsed.data.note } : {}),
      report: {
        created: applied.created,
        updated: applied.updated,
        skipped: applied.skipped,
        errors: applied.errors,
        results: applied.results,
      },
    });

    if (!committed) {
      return { ok: true, duplicate: false, committed: false, report, event };
    }

    await writeRepo<ProductPublication>(safeShop, [
      ...applied.createdProducts,
      ...applied.nextExisting,
    ]);
    await appendProductImport(safeShop, event);

    return { ok: true, duplicate: false, committed: true, report, event };
  } finally {
    await handle.close();
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- COM-UPL: lock path validated via safeFs.shopPath()
    await fs.unlink(lockFile).catch(() => {});
  }
}
