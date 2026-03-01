/* eslint-disable -- XAUP-0001 [ttl=2026-12-31] uploader submission zip helper pending security audit */

import { stat } from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

import * as yazl from "yazl";
import { toPositiveInt, validateMinImageEdge } from "@acme/lib";

import {
  catalogProductDraftSchema,
  joinList,
  slugify,
  splitList,
  type CatalogProductDraftInput,
} from "@acme/lib/xa";
import { buildCsvRowUpdateFromDraft } from "@acme/lib/xa";
import { buildCsvHeader, csvEscape, type XaProductsCsvRow } from "@acme/lib/xa";
import { expandFileSpec } from "@acme/lib/xa";
import { readImageDimensions } from "@acme/lib/xa";

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

const DEFAULT_MAX_FILES_SCANNED = 10_000;
const DEFAULT_MAX_FILES_PER_SPEC = 500;
const DEFAULT_MAX_IMAGES_PER_PRODUCT = 100;
const DEFAULT_MAX_IMAGES_PER_SUBMISSION = 400;
const DEFAULT_MAX_IMAGE_BYTES = 8 * 1024 * 1024;

function getMaxFilesScanned(): number {
  return toPositiveInt(process.env.XA_UPLOADER_MAX_FILES_SCANNED, DEFAULT_MAX_FILES_SCANNED, 1);
}

function getMaxFilesPerSpec(): number {
  return toPositiveInt(process.env.XA_UPLOADER_MAX_FILES_PER_SPEC, DEFAULT_MAX_FILES_PER_SPEC, 1);
}

function getMaxImagesPerProduct(): number {
  return toPositiveInt(
    process.env.XA_UPLOADER_MAX_IMAGES_PER_PRODUCT,
    DEFAULT_MAX_IMAGES_PER_PRODUCT,
    1,
  );
}

function getMaxImagesPerSubmission(): number {
  return toPositiveInt(
    process.env.XA_UPLOADER_MAX_IMAGES_PER_SUBMISSION,
    DEFAULT_MAX_IMAGES_PER_SUBMISSION,
    1,
  );
}

function getMaxImageBytes(): number {
  return toPositiveInt(process.env.XA_UPLOADER_MAX_IMAGE_BYTES, DEFAULT_MAX_IMAGE_BYTES, 1);
}

function resolveAllowedImageRoots(baseDir: string): string[] {
  const configured = (process.env.XA_UPLOADER_ALLOWED_IMAGE_ROOTS ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => (path.isAbsolute(entry) ? entry : path.resolve(baseDir, entry)));

  return Array.from(new Set([baseDir, ...configured]));
}

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
  const fallback = 1600;
  return toPositiveInt(raw, fallback, 1);
}

export async function buildSubmissionZipFromCloudDrafts({
  products,
  options,
}: {
  products: CatalogProductDraftInput[];
  options: Pick<BuildSubmissionZipOptions, "maxProducts" | "maxBytes">;
}): Promise<{
  filename: string;
  manifest: SubmissionZipManifest;
  stream: NodeJS.ReadableStream;
}> {
  if (products.length < 1 || products.length > options.maxProducts) {
    throw new Error(`Select 1–${options.maxProducts} products per submission.`);
  }

  const zip = new yazl.ZipFile();
  const submissionId = crypto.randomUUID().replace(/-/g, "");
  const createdAt = new Date().toISOString();
  const filename = `submission.${createdAt.slice(0, 10)}.${submissionId}.zip`;
  const suggestedR2Key = `submissions/${createdAt.slice(0, 10)}/${filename}`;

  const csvRows: XaProductsCsvRow[] = [];
  const manifestProducts: SubmissionZipManifest["products"] = [];

  for (const draftInput of products) {
    const draft = catalogProductDraftSchema.parse(draftInput);
    const productSlug = slugify(draft.slug?.trim() || draft.title);
    if (!productSlug) throw new Error("Missing product slug/title.");
    const row = buildCsvRowUpdateFromDraft(draftInput);
    if (!row.id) row.id = crypto.randomUUID();
    csvRows.push(row);
    manifestProducts.push({
      slug: productSlug,
      title: draft.title,
      imageCount: splitList(draft.imageFiles ?? "").length,
    });
  }

  const header = buildCsvHeader([]);
  const productsCsv = buildCsvString(header, csvRows);
  const manifest: SubmissionZipManifest = {
    submissionId,
    createdAt,
    suggestedR2Key,
    products: manifestProducts,
    totals: {
      products: products.length,
      images: manifestProducts.reduce((sum, entry) => sum + entry.imageCount, 0),
      bytes: Buffer.byteLength(productsCsv, "utf8"),
    },
    tool: {
      name: "catalog-packager-cloud",
      version: process.env.npm_package_version || "unknown",
    },
  };

  const manifestJson = `${JSON.stringify(manifest, null, 2)}\n`;
  const totalBytes = Buffer.byteLength(productsCsv, "utf8") + Buffer.byteLength(manifestJson, "utf8");
  if (totalBytes > options.maxBytes) {
    throw new Error("Submission is too large. Reduce products.");
  }

  zip.addBuffer(Buffer.from(productsCsv, "utf8"), "products.csv");
  zip.addBuffer(Buffer.from(manifestJson, "utf8"), "manifest.json");
  zip.end();

  return { filename, manifest, stream: zip.outputStream };
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
  const allowedImageRoots = resolveAllowedImageRoots(baseDir);
  const maxFilesScanned = getMaxFilesScanned();
  const maxFilesPerSpec = getMaxFilesPerSpec();
  const maxImagesPerProduct = getMaxImagesPerProduct();
  const maxImagesPerSubmission = getMaxImagesPerSubmission();
  const maxImageBytes = getMaxImageBytes();

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
    if (!productSlug) throw new Error("Missing product slug/title.");

    const fileSpecs = splitList(draft.imageFiles ?? "");
    if (!fileSpecs.length) {
      throw new Error(`"${productSlug}": add at least one image file spec.`);
    }

    const altSpecs = splitList(draft.imageAltTexts ?? "");
    const roleSpecs = splitList(draft.imageRoles ?? "");
    const packagedFiles: string[] = [];
    const packagedAltTexts: string[] = [];
    const packagedMediaPaths: string[] = [];

    for (const [specIndex, fileSpec] of fileSpecs.entries()) {
      const altText = altSpecs[specIndex] || draft.title || productSlug;
      const role = roleSpecs[specIndex] || "front";
      const resolved = await expandFileSpec(fileSpec, baseDir, {
        recursiveDirs: options.recursiveDirs,
        allowedRoots: allowedImageRoots,
        maxFilesScanned,
        maxMatches: maxFilesPerSpec,
      }).catch((err) => {
        const message = err instanceof Error ? err.message : String(err);
        throw new Error(`"${productSlug}": ${message}`);
      });

      for (const resolvedPath of resolved) {
        if (packagedFiles.length >= maxImagesPerProduct) {
          throw new Error(
            `"${productSlug}": too many images for one product. Maximum is ${maxImagesPerProduct}.`,
          );
        }
        if (totalImages >= maxImagesPerSubmission) {
          throw new Error(`Submission has too many images. Maximum is ${maxImagesPerSubmission}.`);
        }

        const info = await stat(resolvedPath).catch(() => null);
        if (!info?.isFile()) {
          throw new Error(`"${productSlug}": not a file: ${fileSpec}`);
        }
        if (info.size <= 0) {
          throw new Error(`"${productSlug}": empty file: ${fileSpec}`);
        }
        if (info.size > maxImageBytes) {
          const maxMb = Math.max(1, Math.floor(maxImageBytes / (1024 * 1024)));
          throw new Error(`"${productSlug}": image exceeds max size of ${maxMb}MB.`);
        }

        const minEdge = getMinImageEdgePx();
        const dims = await readImageDimensions(resolvedPath).catch((err) => {
          const message = err instanceof Error ? err.message : "Unsupported image format.";
          throw new Error(`"${productSlug}": ${message}`);
        });
        if (!validateMinImageEdge(dims.width, dims.height, minEdge)) {
          throw new Error(
            `"${productSlug}": image is too small (${dims.width}x${dims.height}). Minimum is ${minEdge}px on the shortest edge.`,
          );
        }

        totalBytes += info.size;
        if (totalBytes > options.maxBytes) {
          throw new Error("Submission is too large. Reduce images or products.");
        }

        const zipPath = path.posix.join(
          "images",
          productSlug,
          buildSafeFileName(resolvedPath),
        );
        zip.addFile(resolvedPath, zipPath);
        packagedFiles.push(zipPath);
        packagedAltTexts.push(altText);
        packagedMediaPaths.push(`${role}:${zipPath}`);
        totalImages += 1;
      }
    }

    const row = buildCsvRowUpdateFromDraft(draftInput);
    if (!row.id) row.id = crypto.randomUUID();
    row.image_files = joinList(packagedFiles);
    row.image_alt_texts = joinList(packagedAltTexts);
    row.media_paths = joinList(packagedMediaPaths);
    row.media_alt_texts = row.image_alt_texts;
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
