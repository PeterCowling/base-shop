/* eslint-disable ds/no-hardcoded-copy, security/detect-non-literal-fs-filename, security/detect-possible-timing-attacks -- HBAG-02 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import type { MediaItem } from "@acme/types";

import {
  formatLaunchCatalogMediaValidation,
  type LaunchSkuMediaInput,
  validateLaunchCatalogMedia,
} from "../src/lib/launchMediaContract";

interface ParsedProduct extends LaunchSkuMediaInput {
  status: string;
}

interface CliOptions {
  filePath: string;
  activeOnly: boolean;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readNonEmptyString(
  value: unknown,
  label: string,
  index: number,
): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${label} must be a non-empty string (products[${index}])`);
  }
  return value;
}

function parseMediaItem(value: unknown, productIndex: number, mediaIndex: number): MediaItem {
  if (!isRecord(value)) {
    throw new Error(
      `media item must be an object (products[${productIndex}].media[${mediaIndex}])`,
    );
  }

  const url = readNonEmptyString(
    value.url,
    `media.url (products[${productIndex}].media[${mediaIndex}])`,
    productIndex,
  );
  const type = value.type;
  if (type !== "image" && type !== "video") {
    throw new Error(
      `media.type must be "image" or "video" (products[${productIndex}].media[${mediaIndex}])`,
    );
  }

  const title = value.title;
  if (title !== undefined && typeof title !== "string") {
    throw new Error(
      `media.title must be a string when set (products[${productIndex}].media[${mediaIndex}])`,
    );
  }

  const altText = value.altText;
  if (altText !== undefined && typeof altText !== "string") {
    throw new Error(
      `media.altText must be a string when set (products[${productIndex}].media[${mediaIndex}])`,
    );
  }

  const tags = value.tags;
  if (
    tags !== undefined &&
    (!Array.isArray(tags) || tags.some((tag) => typeof tag !== "string"))
  ) {
    throw new Error(
      `media.tags must be an array of strings when set (products[${productIndex}].media[${mediaIndex}])`,
    );
  }

  return {
    url,
    type,
    title,
    altText,
    tags,
  };
}

function parseCatalogProducts(raw: unknown): ParsedProduct[] {
  if (!Array.isArray(raw)) {
    throw new Error("catalog root must be an array");
  }

  return raw.map((entry, index) => {
    if (!isRecord(entry)) {
      throw new Error(`products[${index}] must be an object`);
    }

    const id = readNonEmptyString(entry.id, "id", index);
    const slug = readNonEmptyString(entry.sku, "sku", index);
    const statusValue = entry.status;
    if (typeof statusValue !== "string" || statusValue.trim().length === 0) {
      throw new Error(`status must be a non-empty string (products[${index}])`);
    }

    const media = entry.media;
    if (!Array.isArray(media)) {
      throw new Error(`media must be an array (products[${index}])`);
    }

    return {
      id,
      slug,
      status: statusValue,
      media: media.map((item, mediaIndex) => parseMediaItem(item, index, mediaIndex)),
    };
  });
}

function resolveDefaultCatalogPath(): string {
  const scriptFile = fileURLToPath(import.meta.url);
  const scriptDir = path.dirname(scriptFile);
  return path.resolve(scriptDir, "../../../data/shops/caryina/products.json");
}

function printUsage(): void {
  console.info(
    [
      "Usage: pnpm --filter @apps/caryina validate:launch-media [--file <path>] [--all-statuses]",
      "  --file <path>      Override catalog JSON path",
      "  --all-statuses     Validate every product instead of only status=active",
    ].join("\n"),
  );
}

function parseCliOptions(argv: string[]): CliOptions {
  const defaultPath = resolveDefaultCatalogPath();
  let filePath = defaultPath;
  let activeOnly = true;

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === "--file") {
      const nextToken = argv[index + 1];
      if (!nextToken) {
        throw new Error("missing value for --file");
      }
      filePath = path.resolve(process.cwd(), nextToken);
      index += 1;
      continue;
    }
    if (token === "--all-statuses") {
      activeOnly = false;
      continue;
    }
    if (token === "--help" || token === "-h") {
      printUsage();
      process.exit(0);
    }
    throw new Error(`unknown argument: ${token}`);
  }

  return { filePath, activeOnly };
}

async function run(): Promise<number> {
  const options = parseCliOptions(process.argv.slice(2));
  const source = await readFile(options.filePath, "utf8");
  const parsed = parseCatalogProducts(JSON.parse(source));
  const skuInputs = options.activeOnly
    ? parsed.filter((product) => product.status === "active")
    : parsed;

  console.info(
    `Validating launch media contract for ${skuInputs.length} SKU(s) from ${options.filePath}`,
  );

  const result = validateLaunchCatalogMedia(skuInputs);
  console.info(formatLaunchCatalogMediaValidation(result));

  return result.ok ? 0 : 1;
}

run()
  .then((exitCode) => {
    process.exitCode = exitCode;
  })
  .catch((error) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`validate-launch-media-contract failed: ${message}`);
    process.exitCode = 1;
  });
