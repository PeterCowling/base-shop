import { ulid } from "ulid";
import type {
  MediaItem,
  ProductPublication,
  PublicationStatus,
} from "@acme/types";
import {
  equalJson,
  normalizeMedia,
  normalizeTranslatedCreate,
  normalizeTranslatedPatch,
} from "./productImport.normalize";
import type { ProductImportItem, ProductImportRowResult } from "../types/productImport";

export type ApplyProductImportResult =
  | {
      ok: true;
      nextExisting: ProductPublication[];
      createdProducts: ProductPublication[];
      created: number;
      updated: number;
      skipped: number;
      errors: number;
      results: ProductImportRowResult[];
    }
  | { ok: false; code: string; message: string; details?: unknown };

function patchWouldChange(
  existing: ProductPublication,
  patch: Partial<ProductPublication>,
): boolean {
  return (
    (patch.sku !== undefined && patch.sku !== existing.sku) ||
    (patch.price !== undefined && patch.price !== existing.price) ||
    (patch.currency !== undefined && patch.currency !== existing.currency) ||
    (patch.status !== undefined && patch.status !== existing.status) ||
    (patch.forSale !== undefined && patch.forSale !== existing.forSale) ||
    (patch.forRental !== undefined && patch.forRental !== existing.forRental) ||
    (patch.deposit !== undefined && patch.deposit !== existing.deposit) ||
    (patch.dailyRate !== undefined && patch.dailyRate !== existing.dailyRate) ||
    (patch.weeklyRate !== undefined && patch.weeklyRate !== existing.weeklyRate) ||
    (patch.monthlyRate !== undefined && patch.monthlyRate !== existing.monthlyRate) ||
    (patch.wearAndTearLimit !== undefined &&
      patch.wearAndTearLimit !== existing.wearAndTearLimit) ||
    (patch.maintenanceCycle !== undefined &&
      patch.maintenanceCycle !== existing.maintenanceCycle) ||
    (patch.rentalTerms !== undefined && patch.rentalTerms !== existing.rentalTerms) ||
    (patch.title !== undefined && !equalJson(patch.title, existing.title)) ||
    (patch.description !== undefined &&
      !equalJson(patch.description, existing.description)) ||
    (patch.media !== undefined && !equalJson(patch.media, existing.media)) ||
    (patch.publishShops !== undefined &&
      !equalJson(patch.publishShops ?? [], existing.publishShops ?? [])) ||
    (patch.availability !== undefined &&
      !equalJson(patch.availability ?? [], existing.availability ?? []))
  );
}

export function applyProductImportItems(args: {
  shop: string;
  importedAt: string;
  defaultCurrency: string;
  defaultStatus: PublicationStatus;
  items: ProductImportItem[];
  existing: ProductPublication[];
}): ApplyProductImportResult {
  const nextExisting = [...args.existing];

  const byId = new Map<string, ProductPublication>();
  const bySku = new Map<string, ProductPublication>();
  const indexById = new Map<string, number>();

  for (const [idx, product] of nextExisting.entries()) {
    byId.set(product.id, product);
    indexById.set(product.id, idx);
    const sku = product.sku?.trim();
    if (!sku) continue;
    if (bySku.has(sku)) {
      return {
        ok: false,
        code: "DUPLICATE_SKU_IN_REPO",
        message: `Duplicate sku '${sku}' in repo; cannot safely import.`,
        details: { sku },
      };
    }
    bySku.set(sku, product);
  }

  const results: ProductImportRowResult[] = [];
  const seenIds = new Set<string>();
  const seenSkus = new Set<string>();
  const seenTargetIds = new Set<string>();
  const createdProducts: ProductPublication[] = [];

  let created = 0;
  let updated = 0;
  let skipped = 0;
  let errors = 0;

  for (const [idx, item] of args.items.entries()) {
    const row = idx + 1;
    const sku = item.sku?.trim() || undefined;
    const id = item.id?.trim() || undefined;

    if (id) {
      if (seenIds.has(id)) {
        errors += 1;
        results.push({
          row,
          action: "error",
          id,
          sku,
          message: "Duplicate id within import payload.",
        });
        continue;
      }
      seenIds.add(id);
    }

    if (sku) {
      if (seenSkus.has(sku)) {
        errors += 1;
        results.push({
          row,
          action: "error",
          id,
          sku,
          message: "Duplicate sku within import payload.",
        });
        continue;
      }
      seenSkus.add(sku);
    }

    const existing = id ? byId.get(id) : sku ? bySku.get(sku) : undefined;
    if (existing) {
      if (seenTargetIds.has(existing.id)) {
        errors += 1;
        results.push({
          row,
          action: "error",
          id: existing.id,
          sku: sku ?? existing.sku,
          message: "Multiple rows target the same product.",
        });
        continue;
      }
      seenTargetIds.add(existing.id);

      const nextSku = sku ?? existing.sku;
      if (nextSku !== existing.sku) {
        const conflict = bySku.get(nextSku);
        if (conflict && conflict.id !== existing.id) {
          errors += 1;
          results.push({
            row,
            action: "error",
            id: existing.id,
            sku: nextSku,
            message: `sku '${nextSku}' already exists.`,
          });
          continue;
        }
      }

      const nextTitle =
        item.title !== undefined
          ? normalizeTranslatedPatch(existing.title, item.title)
          : existing.title;
      const nextDescription =
        item.description !== undefined
          ? normalizeTranslatedPatch(existing.description, item.description)
          : existing.description;
      const nextMedia =
        item.media !== undefined
          ? normalizeMedia(
              item.media as unknown as Array<string | Partial<MediaItem>>,
            ) ?? []
          : existing.media;

      const patch: Partial<ProductPublication> = {
        ...(nextSku !== existing.sku ? { sku: nextSku } : {}),
        ...(item.title !== undefined ? { title: nextTitle } : {}),
        ...(item.description !== undefined ? { description: nextDescription } : {}),
        ...(item.price !== undefined ? { price: item.price } : {}),
        ...(item.currency !== undefined ? { currency: item.currency } : {}),
        ...(item.status !== undefined ? { status: item.status } : {}),
        ...(item.publishShops !== undefined ? { publishShops: item.publishShops } : {}),
        ...(item.media !== undefined ? { media: nextMedia } : {}),
        ...(item.rentalTerms !== undefined ? { rentalTerms: item.rentalTerms } : {}),
        ...(item.deposit !== undefined ? { deposit: item.deposit } : {}),
        ...(item.forSale !== undefined ? { forSale: item.forSale } : {}),
        ...(item.forRental !== undefined ? { forRental: item.forRental } : {}),
        ...(item.dailyRate !== undefined ? { dailyRate: item.dailyRate } : {}),
        ...(item.weeklyRate !== undefined ? { weeklyRate: item.weeklyRate } : {}),
        ...(item.monthlyRate !== undefined ? { monthlyRate: item.monthlyRate } : {}),
        ...(item.wearAndTearLimit !== undefined
          ? { wearAndTearLimit: item.wearAndTearLimit }
          : {}),
        ...(item.maintenanceCycle !== undefined
          ? { maintenanceCycle: item.maintenanceCycle }
          : {}),
        ...(item.availability !== undefined ? { availability: item.availability } : {}),
      };

      if (!patchWouldChange(existing, patch)) {
        skipped += 1;
        results.push({ row, action: "skipped", id: existing.id, sku: existing.sku });
        continue;
      }

      const next: ProductPublication = {
        ...existing,
        ...patch,
        row_version: existing.row_version + 1,
        updated_at: args.importedAt,
      };

      const productIdx = indexById.get(existing.id);
      if (typeof productIdx === "number") {
        nextExisting[productIdx] = next;
      }

      byId.set(next.id, next);
      if (nextSku !== existing.sku) {
        bySku.delete(existing.sku);
        bySku.set(nextSku, next);
      } else {
        bySku.set(existing.sku, next);
      }

      updated += 1;
      results.push({ row, action: "updated", id: next.id, sku: next.sku });
      continue;
    }

    if (!sku) {
      errors += 1;
      results.push({
        row,
        action: "error",
        id,
        message: "sku is required to create a product.",
      });
      continue;
    }
    if (!item.title) {
      errors += 1;
      results.push({
        row,
        action: "error",
        sku,
        message: "title is required to create a product.",
      });
      continue;
    }

    const createdId = id ?? ulid();
    if (seenTargetIds.has(createdId)) {
      errors += 1;
      results.push({
        row,
        action: "error",
        id: createdId,
        sku,
        message: "Multiple rows target the same product.",
      });
      continue;
    }
    seenTargetIds.add(createdId);

    if (byId.has(createdId)) {
      errors += 1;
      results.push({
        row,
        action: "error",
        id: createdId,
        sku,
        message: `id '${createdId}' already exists.`,
      });
      continue;
    }
    if (bySku.has(sku)) {
      errors += 1;
      results.push({
        row,
        action: "error",
        sku,
        message: `sku '${sku}' already exists.`,
      });
      continue;
    }

    const title = normalizeTranslatedCreate(item.title, sku);
    const description = normalizeTranslatedCreate(item.description, "");
    const media = normalizeMedia(
      item.media as unknown as Array<string | Partial<MediaItem>> | undefined,
    );

    const product: ProductPublication = {
      id: createdId,
      sku,
      title,
      description,
      price: item.price ?? 0,
      currency: item.currency ?? args.defaultCurrency,
      media: media ?? [],
      shop: args.shop,
      status: item.status ?? args.defaultStatus,
      ...(item.publishShops ? { publishShops: item.publishShops } : {}),
      ...(item.rentalTerms ? { rentalTerms: item.rentalTerms } : {}),
      ...(typeof item.deposit === "number" ? { deposit: item.deposit } : {}),
      ...(typeof item.forSale === "boolean" ? { forSale: item.forSale } : {}),
      ...(typeof item.forRental === "boolean" ? { forRental: item.forRental } : {}),
      ...(typeof item.dailyRate === "number" ? { dailyRate: item.dailyRate } : {}),
      ...(typeof item.weeklyRate === "number" ? { weeklyRate: item.weeklyRate } : {}),
      ...(typeof item.monthlyRate === "number" ? { monthlyRate: item.monthlyRate } : {}),
      ...(typeof item.wearAndTearLimit === "number"
        ? { wearAndTearLimit: item.wearAndTearLimit }
        : {}),
      ...(typeof item.maintenanceCycle === "number"
        ? { maintenanceCycle: item.maintenanceCycle }
        : {}),
      ...(item.availability ? { availability: item.availability } : {}),
      row_version: 1,
      created_at: args.importedAt,
      updated_at: args.importedAt,
    };

    createdProducts.push(product);
    byId.set(product.id, product);
    bySku.set(product.sku, product);
    created += 1;
    results.push({ row, action: "created", id: product.id, sku: product.sku });
  }

  return {
    ok: true,
    nextExisting,
    createdProducts,
    created,
    updated,
    skipped,
    errors,
    results,
  };
}

