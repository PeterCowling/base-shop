/* eslint-disable -- XAUP-0001 [ttl=2026-12-31] uploader submission zip helper pending security audit */

import { stat } from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

import * as yazl from "yazl";

import {
  catalogProductDraftSchema,
  joinList,
  slugify,
  splitList,
  type CatalogProductDraftInput,
} from "./catalogAdminSchema";
import { buildCsvRowUpdateFromDraft } from "./catalogCsvMapping";
import { buildCsvHeader, csvEscape, type XaProductsCsvRow } from "./catalogCsvFormat";
import { expandFileSpec } from "./fileGlob";
import { readImageDimensions } from "./imageDimensions";

export type SubmissionZipManifest = {
  submissionId: string;
  createdAt: string;
  suggestedR2Key: string;
  products: Array<{ slug: string; title: string; imageCount: number }>;
  totals: { products: number; images: number; bytes: number };
  tool: { name: string; version: string };
};

type BuildSubmissionZipOptions = {
  maxProducts: number;
  maxBytes: number;
  recursiveDirs: boolean;
};

function buildCsvString(header: string[], rows: XaProductsCsvRow[]): string {
  return (
    `${header.join(",")}\n` +
    rows
      .map((row) => header.map((key) => csvEscape(row[key] ?? "")).join(","))
      .join("\n") +
    "\n"
  );
}

function buildSafeFileName(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase() || ".jpg";
  const id = crypto.randomUUID().replace(/-/g, "");
  return `${id}${ext}`;
}

function getMinImageEdgePx(): number {
  const raw =
    process.env.XA_UPLOADER_MIN_IMAGE_EDGE ??
    process.env.NEXT_PUBLIC_XA_UPLOADER_MIN_IMAGE_EDGE ??
    "";
  const parsed = Number(raw);
  const fallback = 1600;
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.floor(parsed);
}

export async function buildSubmissionZipStream({
  products,
  productsCsvPath,
  options,
}: {
  products: CatalogProductDraftInput[];
  productsCsvPath: string;
  options: BuildSubmissionZipOptions;
}): Promise<{
  filename: string;
  manifest: SubmissionZipManifest;
  stream: NodeJS.ReadableStream;
}> {
  if (products.length < 1 || products.length > options.maxProducts) {
    throw new Error(`Select 1–${options.maxProducts} products per submission.`);
  }

  const baseDir = path.dirname(path.resolve(productsCsvPath));
  const zip = new yazl.ZipFile();

  const submissionId = crypto.randomUUID().replace(/-/g, "");
  const createdAt = new Date().toISOString();
  const filename = `submission.${createdAt.slice(0, 10)}.${submissionId}.zip`;
  const suggestedR2Key = `submissions/${createdAt.slice(0, 10)}/${filename}`;

  const csvRows: XaProductsCsvRow[] = [];
  const manifestProducts: SubmissionZipManifest["products"] = [];

  let totalImages = 0;
  let totalBytes = 0;

  for (const draftInput of products) {
    const draft = catalogProductDraftSchema.parse(draftInput);
    const productSlug = slugify(draft.slug?.trim() || draft.title);
    if (!productSlug) throw new Error(`Missing product slug/title.`);

    const fileSpecs = splitList(draft.imageFiles ?? "");
    if (!fileSpecs.length) {
      throw new Error(`"${productSlug}": add at least one image file spec.`);
    }

    const altSpecs = splitList(draft.imageAltTexts ?? "");
    const packagedFiles: string[] = [];
    const packagedAltTexts: string[] = [];

    for (const [specIndex, fileSpec] of fileSpecs.entries()) {
      const altText = altSpecs[specIndex] || draft.title || productSlug;
      const resolved = await expandFileSpec(fileSpec, baseDir, {
        recursiveDirs: options.recursiveDirs,
      }).catch((err) => {
        const message = err instanceof Error ? err.message : String(err);
        throw new Error(`"${productSlug}": ${message}`);
      });

      for (const resolvedPath of resolved) {
        const info = await stat(resolvedPath).catch(() => null);
        if (!info?.isFile()) {
          throw new Error(`"${productSlug}": not a file: ${fileSpec}`);
        }
        if (info.size <= 0) {
          throw new Error(`"${productSlug}": empty file: ${fileSpec}`);
        }

        const minEdge = getMinImageEdgePx();
        const dims = await readImageDimensions(resolvedPath).catch((err) => {
          const message = err instanceof Error ? err.message : "Unsupported image format.";
          throw new Error(`"${productSlug}": ${message}`);
        });
        const shortest = Math.min(dims.width, dims.height);
        if (shortest < minEdge) {
          throw new Error(
            `"${productSlug}": image is too small (${dims.width}x${dims.height}). Minimum is ${minEdge}px on the shortest edge.`,
          );
        }

        totalBytes += info.size;
        if (totalBytes > options.maxBytes) {
          throw new Error(`Submission is too large. Reduce images or products.`);
        }

        const zipPath = path.posix.join(
          "images",
          productSlug,
          buildSafeFileName(resolvedPath),
        );
        zip.addFile(resolvedPath, zipPath);
        packagedFiles.push(zipPath);
        packagedAltTexts.push(altText);
        totalImages += 1;
      }
    }

    const row = buildCsvRowUpdateFromDraft(draftInput);
    if (!row.id) row.id = crypto.randomUUID();
    row.image_files = joinList(packagedFiles);
    row.image_alt_texts = joinList(packagedAltTexts);
    csvRows.push(row);

    manifestProducts.push({ slug: productSlug, title: draft.title, imageCount: packagedFiles.length });
  }

  const header = buildCsvHeader([]);
  const productsCsv = buildCsvString(header, csvRows);
  zip.addBuffer(Buffer.from(productsCsv, "utf8"), "products.csv");

  const manifest: SubmissionZipManifest = {
    submissionId,
    createdAt,
    suggestedR2Key,
    products: manifestProducts,
    totals: { products: products.length, images: totalImages, bytes: totalBytes },
    tool: {
      name: "catalog-packager",
      version: process.env.npm_package_version || "unknown",
    },
  };
  zip.addBuffer(Buffer.from(`${JSON.stringify(manifest, null, 2)}\n`, "utf8"), "manifest.json");

  zip.end();

  return { filename, manifest, stream: zip.outputStream };
}
