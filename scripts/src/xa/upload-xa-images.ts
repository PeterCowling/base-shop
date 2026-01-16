import { readFile, stat, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import { parseArgs } from "node:util";

import { ulid } from "ulid";

import { expandFileSpec } from "./xa-file-glob";
import { readImageDimensions } from "./xa-image-dimensions";
import {
  type MediaItem,
  fileExists,
  getRowNumber,
  loadEnvFile,
  parseOptionalNumber,
  pick,
  readCsv,
  sha256File,
} from "./xa-utils";

type UploadRow = {
  productSlug: string;
  filePath: string;
  fileSpec: string;
  altText?: string;
  position?: number;
  index: number;
  rowNumber: number;
};

type UploadedEntry = UploadRow & {
  path: string;
};

type UploadState = {
  entries: Array<{
    key: string;
    productSlug: string;
    filePath: string;
    path: string;
    altText?: string;
    position?: number;
    index: number;
    sha256?: string;
    size?: number;
    mtimeMs?: number;
  }>;
};

const DEFAULT_OUT = path.join("apps", "xa", "src", "data", "catalog.media.json");

function printUsage() {
  console.log(
    [
      "Usage:",
      "  XA_CLOUDFLARE_ACCOUNT_ID=... XA_CLOUDFLARE_IMAGES_TOKEN=... node --import tsx scripts/src/xa/upload-xa-images.ts --images <images.csv> [--out <media.json>] [--base-dir <dir>] [--state <state.json>] [--concurrency <n>] [--replace] [--recursive] [--min-image-edge <px>] [--dry-run] [--strict] [--env-file <path>] [--env <name>]",
      "",
      "Images CSV columns:",
      "  product_slug, file, alt_text, position",
      "",
      'Notes:',
      "  - If --base-dir is omitted, file paths are resolved relative to the images CSV location.",
      "  - The file column may be a file path, a directory, or a glob (e.g. images/shoes/*.jpg).",
      "",
      "Outputs:",
      "  media JSON in the shape:",
      '  { "mediaByProduct": { "<slug>": [{ "type": "image", "path": "id", "altText": "..." }] } }',
    ].join("\n"),
  );
}

async function assertMinImageEdge(filePath: string, minEdge: number): Promise<void> {
  let dims: Awaited<ReturnType<typeof readImageDimensions>>;
  try {
    dims = await readImageDimensions(filePath);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unsupported image format.";
    throw new Error(message);
  }

  const shortest = Math.min(dims.width, dims.height);
  if (shortest < minEdge) {
    throw new Error(
      `Image is too small (${dims.width}x${dims.height}). Minimum is ${minEdge}px on the shortest edge.`,
    );
  }
}

async function readState(statePath: string | undefined): Promise<UploadState | null> {
  if (!statePath) return null;
  if (!(await fileExists(statePath))) return { entries: [] };
  const raw = await readFile(statePath, "utf8");
  const parsed = JSON.parse(raw) as UploadState;
  if (!parsed?.entries) return { entries: [] };
  return parsed;
}

async function writeState(statePath: string | undefined, entries: UploadState["entries"]) {
  if (!statePath) return;
  await writeFile(statePath, `${JSON.stringify({ entries }, null, 2)}\n`, "utf8");
}

async function runWithConcurrency<T>(
  tasks: Array<() => Promise<T>>,
  limit: number,
): Promise<T[]> {
  const results: T[] = [];
  let cursor = 0;

  const workers = Array.from({ length: limit }).map(async () => {
    while (cursor < tasks.length) {
      const idx = cursor++;
      results[idx] = await tasks[idx]();
    }
  });

  await Promise.all(workers);
  return results;
}

async function uploadImage(
  row: UploadRow,
  accountId: string,
  token: string,
): Promise<UploadedEntry & { sha256: string; size: number; mtimeMs: number }> {
  const payload = await readFile(row.filePath);
  const form = new FormData();
  const imageId = ulid();
  const ext = path.extname(row.filePath).toLowerCase() || ".jpg";
  const safeName = `${imageId}${ext}`;
  form.append("file", new Blob([payload]), safeName);
  form.append("id", imageId);

  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/images/v1`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: form,
    },
  );

  const json = (await res.json().catch(() => ({}))) as {
    success?: boolean;
    errors?: Array<{ message?: string }>;
    result?: { id?: string };
  };

  if (!res.ok || json.success === false) {
    const message = json.errors?.[0]?.message ?? `Upload failed (${res.status})`;
    throw new Error(`${path.basename(row.filePath)}: ${message}`);
  }

  const id = json.result?.id ?? imageId;
  const stats = await stat(row.filePath);
  const sha256 = createHash("sha256").update(payload).digest("hex");
  return { ...row, path: id, sha256, size: stats.size, mtimeMs: stats.mtimeMs };
}

async function main(): Promise<void> {
  const { values } = parseArgs({
    options: {
      images: { type: "string" },
      out: { type: "string" },
      "base-dir": { type: "string" },
      state: { type: "string" },
      concurrency: { type: "string" },
      replace: { type: "boolean", default: false },
      recursive: { type: "boolean", default: false },
      "min-image-edge": { type: "string" },
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

  const imagesPath = values.images;
  if (!imagesPath) {
    printUsage();
    throw new Error("Missing --images CSV path.");
  }

  const envName = values.env ? String(values.env) : undefined;
  const envFileArg = values["env-file"] ? String(values["env-file"]) : undefined;
  const envCandidates = [
    envFileArg,
    envName ? path.join("apps", "xa-uploader", "data", `.env.xa.${envName}`) : undefined,
    path.join("apps", "xa-uploader", "data", ".env.xa"),
    path.join(process.cwd(), ".env"),
  ].filter(Boolean) as string[];
  for (const candidate of envCandidates) {
    if (await fileExists(candidate)) {
      loadEnvFile(candidate);
      break;
    }
  }

  const imagesAbsPath = path.resolve(String(imagesPath));
  const baseDir = values["base-dir"]
    ? String(values["base-dir"])
    : path.dirname(imagesAbsPath);
  const outPath = values.out ? String(values.out) : DEFAULT_OUT;
  const statePath = values.state ? String(values.state) : undefined;
  const concurrency = Math.max(1, Number(values.concurrency ?? 4) || 4);
  const strict = Boolean(values.strict);
  const replace = Boolean(values.replace);
  const recursiveDirs = Boolean(values.recursive);
  const dryRun = Boolean(values["dry-run"]);
  const minImageEdge = Math.max(1, Number(values["min-image-edge"] ?? 1600) || 1600);

  const rows = await readCsv(String(imagesPath));
  const seenKeys = new Set<string>();
  const uploads: UploadRow[] = [];
  for (const row of rows) {
    const rowNumber = getRowNumber(row) ?? 0;
    const productSlug = pick(row, ["product_slug", "slug", "product"]);
    const fileSpec = pick(row, ["file", "file_path", "filepath", "path"]);
    if (!productSlug || !fileSpec) {
      throw new Error(`Row ${rowNumber || "?"} is missing product_slug or file (images CSV).`);
    }

    const resolvedFiles = await expandFileSpec(fileSpec, baseDir, {
      recursiveDirs,
    }).catch((err) => {
      const message = err instanceof Error ? err.message : String(err);
      throw new Error(`Row ${rowNumber || "?"}: ${message}`);
    });

    const basePosition = parseOptionalNumber(pick(row, ["position", "order", "index"]));
    for (const [offset, filePath] of resolvedFiles.entries()) {
      const position = basePosition !== undefined ? basePosition + offset : undefined;
      const key = `${productSlug}::${filePath}`;
      if (seenKeys.has(key)) {
        throw new Error(`Duplicate image row for ${productSlug} (${filePath}).`);
      }
      seenKeys.add(key);
      uploads.push({
        productSlug,
        filePath,
        fileSpec,
        altText: pick(row, ["alt_text", "alt", "alttext"]) || undefined,
        position,
        index: uploads.length,
        rowNumber,
      });
    }
  }

  const state = await readState(statePath);
  const stateMap = new Map<string, UploadState["entries"][number]>();
  for (const entry of state?.entries ?? []) {
    stateMap.set(entry.key, entry);
  }

  const tasks: Array<() => Promise<UploadedEntry>> = [];
  const existing: UploadedEntry[] = [];
  const stateEntries: UploadState["entries"] = [];
  const warnings: string[] = [];
  let cachedCount = 0;
  let newUploadCount = 0;
  let replaceUploadCount = 0;
  let changedButNotReplacedCount = 0;
  let missingHashInStateCount = 0;
  let completedUploads = 0;
  let totalUploads = 0;

  const accountId = process.env.XA_CLOUDFLARE_ACCOUNT_ID;
  const token = process.env.XA_CLOUDFLARE_IMAGES_TOKEN;

  let pendingStateWrite = Promise.resolve();
  const queueStateWrite = async () => {
    if (!statePath) return;
    pendingStateWrite = pendingStateWrite.then(() =>
      writeState(statePath, stateEntries),
    );
    await pendingStateWrite;
  };

  for (const row of uploads) {
    const key = `${row.productSlug}::${row.filePath}`;
    const cached = stateMap.get(key);
    const info = await stat(row.filePath).catch(() => null);
    if (!info?.isFile()) {
      throw new Error(`Row ${row.rowNumber || "?"}: Not a file: ${row.filePath}`);
    }
    if (strict && info.size === 0) {
      throw new Error(`Row ${row.rowNumber || "?"}: Empty file: ${row.filePath}`);
    }
    await assertMinImageEdge(row.filePath, minImageEdge).catch((err) => {
      const message = err instanceof Error ? err.message : String(err);
      throw new Error(`Row ${row.rowNumber || "?"}: ${message} (${row.fileSpec})`);
    });

    if (cached) {
      cachedCount += 1;

      const maybeUpdateMeta = async (): Promise<{
        sha256?: string;
        size?: number;
        mtimeMs?: number;
      }> => {
        if (cached.sha256) {
          if (cached.size === info.size && cached.mtimeMs === info.mtimeMs) {
            return { sha256: cached.sha256, size: cached.size, mtimeMs: cached.mtimeMs };
          }
          const currentSha = await sha256File(row.filePath);
          if (currentSha === cached.sha256) {
            return { sha256: cached.sha256, size: info.size, mtimeMs: info.mtimeMs };
          }
          return {};
        }

        missingHashInStateCount += 1;
        const currentSha = await sha256File(row.filePath);
        return { sha256: currentSha, size: info.size, mtimeMs: info.mtimeMs };
      };

      let metaToStore: { sha256?: string; size?: number; mtimeMs?: number } = {};
      if (!cached.sha256 || cached.size !== info.size || cached.mtimeMs !== info.mtimeMs) {
        metaToStore = await maybeUpdateMeta();
      }

      const changed =
        Boolean(cached.sha256) &&
        (cached.size !== info.size || cached.mtimeMs !== info.mtimeMs) &&
        (!metaToStore.sha256 || metaToStore.sha256 !== cached.sha256);

      if (changed && !replace) {
        changedButNotReplacedCount += 1;
        const message = `Row ${row.rowNumber || "?"}: file changed since last upload for ${row.productSlug} (${row.fileSpec}). Re-run with --replace.`;
        if (strict) throw new Error(message);
        warnings.push(message);
        existing.push({ ...row, path: cached.path });
        stateEntries.push({
          ...cached,
          altText: row.altText ?? cached.altText,
          position: row.position ?? cached.position,
          index: row.index,
        });
        continue;
      }

      if (changed && replace) {
        replaceUploadCount += 1;
      } else {
        existing.push({ ...row, path: cached.path });
        stateEntries.push({
          ...cached,
          ...metaToStore,
          altText: row.altText ?? cached.altText,
          position: row.position ?? cached.position,
          index: row.index,
        });
        continue;
      }
    }

    if (!cached) {
      newUploadCount += 1;
    }

    tasks.push(async () => {
      if (!accountId || !token) {
        throw new Error(
          "XA_CLOUDFLARE_ACCOUNT_ID and XA_CLOUDFLARE_IMAGES_TOKEN are required.",
        );
      }

      const uploaded = await uploadImage(row, accountId, token);
      const entry = {
        key,
        productSlug: uploaded.productSlug,
        filePath: uploaded.filePath,
        path: uploaded.path,
        altText: uploaded.altText,
        position: uploaded.position,
        index: uploaded.index,
        sha256: uploaded.sha256,
        size: uploaded.size,
        mtimeMs: uploaded.mtimeMs,
      };
      stateEntries.push(entry);
      await queueStateWrite();
      completedUploads += 1;
      const prefix = totalUploads ? `[${completedUploads}/${totalUploads}] ` : "";
      console.log(`${prefix}Uploaded ${path.basename(row.filePath)} -> ${uploaded.path}`);
      return uploaded;
    });
  }

  if (dryRun) {
    const summary = [
      `Images: ${uploads.length}`,
      `Cached: ${cachedCount}`,
      newUploadCount ? `Will upload new: ${newUploadCount}` : undefined,
      replaceUploadCount ? `Will replace: ${replaceUploadCount}` : undefined,
      changedButNotReplacedCount ? `Changed (needs --replace): ${changedButNotReplacedCount}` : undefined,
      missingHashInStateCount ? `State missing hashes: ${missingHashInStateCount}` : undefined,
      replace ? "Replace mode: on" : "Replace mode: off",
      recursiveDirs ? "Recursive directories: on" : "Recursive directories: off",
    ];
    console.log(summary.filter(Boolean).join(" | "));
    for (const warning of warnings) {
      console.warn(warning);
    }
    console.log(`Dry-run complete (no uploads, no writes).`);
    return;
  }

  if (tasks.length > 0 && (!accountId || !token)) {
    throw new Error("XA_CLOUDFLARE_ACCOUNT_ID and XA_CLOUDFLARE_IMAGES_TOKEN are required.");
  }

  totalUploads = tasks.length;
  const uploaded = await runWithConcurrency(tasks, concurrency);
  const allEntries = [...existing, ...uploaded];

  const mediaByProduct: Record<
    string,
    Array<{ type: "image"; path: string; altText?: string; _order: number }>
  > = {};

  for (const entry of allEntries) {
    const order = entry.position ?? entry.index;
    mediaByProduct[entry.productSlug] ||= [];
    mediaByProduct[entry.productSlug].push({
      type: "image",
      path: entry.path,
      altText: entry.altText,
      _order: order,
    });
  }

  const output: { mediaByProduct: Record<string, Array<MediaItem>> } = {
    mediaByProduct: {},
  };

  for (const [slug, items] of Object.entries(mediaByProduct)) {
    output.mediaByProduct[slug] = items
      .sort((a, b) => a._order - b._order)
      .map(({ _order, ...item }) => ({
        type: "image",
        path: item.path,
        altText: item.altText,
      }));
  }

  await writeFile(outPath, `${JSON.stringify(output, null, 2)}\n`, "utf8");
  console.log(`Wrote media mapping for ${Object.keys(output.mediaByProduct).length} products to ${outPath}`);
  console.log(
    [
      `Uploaded: ${uploaded.length}`,
      replaceUploadCount ? `Replaced: ${replaceUploadCount}` : undefined,
      `Cached: ${existing.length}`,
      changedButNotReplacedCount ? `Changed (needs --replace): ${changedButNotReplacedCount}` : undefined,
      missingHashInStateCount ? `State missing hashes: ${missingHashInStateCount}` : undefined,
      warnings.length ? `Warnings: ${warnings.length}` : undefined,
    ]
      .filter(Boolean)
      .join(" | "),
  );
  for (const warning of warnings) {
    console.warn(warning);
  }

  if (statePath) {
    await writeState(statePath, stateEntries);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
