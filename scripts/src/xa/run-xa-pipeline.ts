import { spawn } from "node:child_process";
import { unlink, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { parseArgs } from "node:util";

import { getRowNumber, parseList, pick, readCsv, slugify } from "./xa-utils";

const DEFAULT_CATALOG = path.join("apps", "xa", "src", "data", "catalog.json");
const DEFAULT_MEDIA = path.join("apps", "xa", "src", "data", "catalog.media.json");

function printUsage() {
  console.log(
    [
      "Usage:",
      "  XA_CLOUDFLARE_ACCOUNT_ID=... XA_CLOUDFLARE_IMAGES_TOKEN=... node --import tsx scripts/src/xa/run-xa-pipeline.ts --products <products.csv> (--images <images.csv> | --simple) [--out <catalog.json>] [--media-out <media.json>] [--base-dir <dir>] [--state <state.json>] [--concurrency <n>] [--replace] [--recursive] [--min-image-edge <px>] [--merge] [--base-catalog <catalog.json>] [--backup] [--backup-dir <dir>] [--dry-run] [--strict] [--env-file <path>]",
      "",
      "Simple mode (no images.csv):",
      '  - Provide image paths in products.csv using columns: image_files and image_alt_texts (pipe-separated).',
    ].join("\n"),
  );
}

async function runNode(scriptPath: string, args: string[]): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const child = spawn(process.execPath, ["--import", "tsx", scriptPath, ...args], {
      stdio: "inherit",
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${path.basename(scriptPath)} exited with code ${code}`));
    });
  });
}

function csvEscape(value: string): string {
  const needsQuotes = /[",\n]/.test(value);
  if (!needsQuotes) return value;
  return `"${value.replace(/"/g, `""`)}"`;
}

async function writeDerivedImagesCsvFromProducts(
  productsCsvPath: string,
): Promise<{ imagesCsvPath: string; baseDir: string; rowCount: number }> {
  const baseDir = path.dirname(path.resolve(productsCsvPath));
  const rows = await readCsv(productsCsvPath);

  const outputRows: Array<{
    product_slug: string;
    file: string;
    alt_text: string;
    position: number;
  }> = [];

  for (const row of rows) {
    const rowNumber = getRowNumber(row);
    const rowLabel = rowNumber ? `Row ${rowNumber}` : "Row ?";
    const title = pick(row, ["title", "name"]);
    const slug = slugify(pick(row, ["slug", "handle"]) || title);
    if (!slug) throw new Error(`${rowLabel}: Missing slug/title for simple image mapping.`);

    const files = parseList(pick(row, ["image_files", "image_file_paths", "image_files_local"]));
    if (!files.length) continue;

    const altTexts = parseList(pick(row, ["image_alt_texts", "image_alts"]));
    for (const [idx, file] of files.entries()) {
      outputRows.push({
        product_slug: slug,
        file,
        alt_text: altTexts[idx] || title || slug,
        position: idx + 1,
      });
    }
  }

  const imagesCsvPath = path.join(
    os.tmpdir(),
    `xa-images.${Date.now()}.${Math.random().toString(16).slice(2)}.csv`,
  );
  const header = "product_slug,file,alt_text,position\n";
  const body = outputRows
    .map((r) =>
      [r.product_slug, r.file, r.alt_text, String(r.position)].map(csvEscape).join(","),
    )
    .join("\n");
  await writeFile(imagesCsvPath, `${header}${body}\n`, "utf8");

  return { imagesCsvPath, baseDir, rowCount: outputRows.length };
}

async function main(): Promise<void> {
  const { values } = parseArgs({
    options: {
      products: { type: "string" },
      images: { type: "string" },
      simple: { type: "boolean", default: false },
      out: { type: "string" },
      "media-out": { type: "string" },
      "base-dir": { type: "string" },
      state: { type: "string" },
      concurrency: { type: "string" },
      replace: { type: "boolean", default: false },
      recursive: { type: "boolean", default: false },
      "min-image-edge": { type: "string" },
      merge: { type: "boolean", default: false },
      "base-catalog": { type: "string" },
      backup: { type: "boolean", default: false },
      "backup-dir": { type: "string" },
      "dry-run": { type: "boolean", default: false },
      "env-file": { type: "string" },
      env: { type: "string" },
      strict: { type: "boolean", default: false },
      help: { type: "boolean", default: false },
    },
  });

  if (values.help) {
    printUsage();
    return;
  }

  const productsPath = values.products;
  const imagesPath = values.images;
  const simple = Boolean(values.simple);
  if (!productsPath || (!imagesPath && !simple)) {
    printUsage();
    throw new Error("Missing --products or an image source (--images or --simple).");
  }

  const strict = Boolean(values.strict);
  const dryRun = Boolean(values["dry-run"]);
  const replace = Boolean(values.replace);
  const recursive = Boolean(values.recursive);
  const merge = Boolean(values.merge);
  const baseCatalog = values["base-catalog"] ? String(values["base-catalog"]) : undefined;
  const backup = Boolean(values.backup);
  const backupDir = values["backup-dir"] ? String(values["backup-dir"]) : undefined;
  const outPath = values.out ? String(values.out) : DEFAULT_CATALOG;
  const mediaOutPath = values["media-out"] ? String(values["media-out"]) : DEFAULT_MEDIA;
  const baseDir = values["base-dir"] ? String(values["base-dir"]) : undefined;
  const statePath = values.state ? String(values.state) : undefined;
  const concurrency = values.concurrency ? String(values.concurrency) : undefined;
  const minImageEdge = values["min-image-edge"] ? String(values["min-image-edge"]) : undefined;
  const envFile = values["env-file"] ? String(values["env-file"]) : undefined;
  const envName = values.env ? String(values.env) : undefined;

  const root = process.cwd();
  const uploadScript = path.join(root, "scripts", "src", "xa", "upload-xa-images.ts");
  const importScript = path.join(root, "scripts", "src", "xa", "import-xa-catalog.ts");

  let derivedImagesCsvPath: string | null = null;
  let uploaderImagesCsvPath = imagesPath ? String(imagesPath) : "";
  let uploaderBaseDir = baseDir;

  try {
    if (!imagesPath && simple) {
      const derived = await writeDerivedImagesCsvFromProducts(String(productsPath));
      derivedImagesCsvPath = derived.imagesCsvPath;
      uploaderImagesCsvPath = derived.imagesCsvPath;
      uploaderBaseDir = uploaderBaseDir || derived.baseDir;
      if (derived.rowCount === 0) {
        throw new Error(
          'Simple mode found 0 images. Add "image_files" (and optional "image_alt_texts") columns to products.csv, or pass --images <images.csv>.',
        );
      }
      console.log(`Simple mode: derived ${derived.rowCount} image rows from products.csv`);
    }

    const uploadArgs = ["--images", uploaderImagesCsvPath, "--out", mediaOutPath];
    if (uploaderBaseDir) uploadArgs.push("--base-dir", uploaderBaseDir);
    if (statePath) uploadArgs.push("--state", statePath);
    if (concurrency) uploadArgs.push("--concurrency", concurrency);
    if (replace) uploadArgs.push("--replace");
    if (recursive) uploadArgs.push("--recursive");
    if (minImageEdge) uploadArgs.push("--min-image-edge", minImageEdge);
    if (dryRun) uploadArgs.push("--dry-run");
    if (strict) uploadArgs.push("--strict");
    if (envFile) uploadArgs.push("--env-file", envFile);
    if (envName) uploadArgs.push("--env", envName);

    await runNode(uploadScript, uploadArgs);

    const importArgs = ["--products", String(productsPath), "--out", outPath];
    if (!dryRun || uploaderImagesCsvPath) {
      importArgs.push("--images", mediaOutPath);
    }
    if (merge) importArgs.push("--merge");
    if (baseCatalog) importArgs.push("--base-catalog", baseCatalog);
    if (backup) importArgs.push("--backup");
    if (backupDir) importArgs.push("--backup-dir", backupDir);
    if (dryRun) importArgs.push("--dry-run");
    if (strict) importArgs.push("--strict");

    await runNode(importScript, importArgs);
  } finally {
    if (derivedImagesCsvPath) {
      await unlink(derivedImagesCsvPath).catch(() => undefined);
    }
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
