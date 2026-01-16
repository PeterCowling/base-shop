import { createWriteStream } from "node:fs";
import { mkdir, readFile, readdir, rename, stat } from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import { parseArgs } from "node:util";
import { Transform } from "node:stream";

import yauzl from "yauzl";

import { fileExists, readCsv } from "./xa-utils";

const DEFAULT_INBOX_DIR = path.join("apps", "xa-uploader", "data", "inbox");
const MAX_SUBMISSION_BYTES = 250 * 1024 * 1024;
const MAX_SUBMISSION_FILES = 2000;

type ExtractOptions = {
  maxBytes: number;
};

function printUsage() {
  console.log(
    [
      "Usage:",
      "  XA_CLOUDFLARE_ACCOUNT_ID=... XA_CLOUDFLARE_IMAGES_TOKEN=... node --import tsx scripts/src/xa/ingest-xa-submission.ts --zip <submission.zip> [--zip <submission2.zip> ...] [--dir <folder>] [--dest <dir>] [--merge] [--strict] [--dry-run] [--replace] [--env-file <path>] [--env <name>]",
      "",
      "This script:",
      "  - extracts products.csv + images/ from a vendor submission ZIP",
      "  - validates inputs",
      "  - uploads images to the XA Cloudflare account",
      "  - merges products into apps/xa/src/data/catalog.json",
    ].join("\n"),
  );
}

function isSafeZipPath(entryName: string): boolean {
  const normalized = entryName.replace(/\\/g, "/");
  if (!normalized) return false;
  if (normalized.includes("\0")) return false;
  if (normalized.startsWith("/")) return false;
  if (/^[a-zA-Z]:\//.test(normalized)) return false;
  const segments = normalized.split("/");
  if (segments.some((seg) => seg === ".." || seg === ".")) return false;
  return true;
}

function allowEntry(entryName: string): boolean {
  const normalized = entryName.replace(/\\/g, "/");
  if (normalized === "products.csv") return true;
  if (normalized === "manifest.json") return true;
  if (normalized === "checksums.sha256") return true;
  if (normalized.startsWith("images/")) return true;
  if (normalized.endsWith("/")) return true;
  return false;
}

async function extractZip(zipPath: string, destDir: string, options: ExtractOptions): Promise<void> {
  await mkdir(destDir, { recursive: true });

  const maxBytes = options.maxBytes;
  let extractedBytes = 0;
  let extractedFiles = 0;

  await new Promise<void>((resolve, reject) => {
    yauzl.open(zipPath, { lazyEntries: true }, (openErr, zipfile) => {
      if (openErr || !zipfile) {
        reject(openErr || new Error("Unable to open zip."));
        return;
      }

      let settled = false;
      const onError = (err: Error) => {
        if (settled) return;
        settled = true;
        zipfile.close();
        reject(err);
      };
      const onDone = () => {
        if (settled) return;
        settled = true;
        zipfile.close();
        resolve();
      };

      zipfile.readEntry();
      zipfile.on("entry", (entry: yauzl.Entry) => {
        const entryName = entry.fileName;
        if (!isSafeZipPath(entryName) || !allowEntry(entryName)) {
          zipfile.readEntry();
          return;
        }

        const expected = Number(entry.uncompressedSize ?? 0) || 0;
        if (expected > maxBytes || extractedBytes + expected > maxBytes) {
          onError(new Error("Submission is too large."));
          return;
        }

        const normalized = entryName.replace(/\\/g, "/");
        const destPath = path.join(destDir, normalized);

        if (normalized.endsWith("/")) {
          mkdir(destPath, { recursive: true })
            .then(() => zipfile.readEntry())
            .catch(onError);
          return;
        }

        extractedFiles += 1;
        if (extractedFiles > MAX_SUBMISSION_FILES) {
          onError(new Error("Submission contains too many files."));
          return;
        }

        mkdir(path.dirname(destPath), { recursive: true })
          .then(() => {
            zipfile.openReadStream(entry, (streamErr, readStream) => {
              if (streamErr || !readStream) {
                onError(streamErr || new Error("Unable to read zip entry."));
                return;
              }
              const writeStream = createWriteStream(destPath, { flags: "w" });
              const limiter = new Transform({
                transform(chunk, _enc, cb) {
                  extractedBytes += chunk.length;
                  if (extractedBytes > maxBytes) {
                    cb(new Error("Submission is too large."));
                    return;
                  }
                  cb(null, chunk);
                },
              });

              const abort = (err: unknown) => {
                const message = err instanceof Error ? err : new Error("Extraction failed.");
                try {
                  readStream.destroy();
                } catch {
                  // ignore
                }
                try {
                  limiter.destroy();
                } catch {
                  // ignore
                }
                try {
                  writeStream.destroy();
                } catch {
                  // ignore
                }
                onError(message instanceof Error ? message : new Error(String(message)));
              };

              readStream.on("error", abort);
              limiter.on("error", abort);
              writeStream.on("error", abort);
              writeStream.on("close", () => {
                if (settled) return;
                zipfile.readEntry();
              });

              readStream.pipe(limiter).pipe(writeStream);
            });
          })
          .catch(onError);
      });

      zipfile.on("end", onDone);
      zipfile.on("error", onError);
    });
  });
}

async function runNodeTsx(scriptPath: string, args: string[]): Promise<void> {
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

async function listZipFiles(dirPath: string): Promise<string[]> {
  const entries = await readdir(dirPath, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter((name) => name.toLowerCase().endsWith(".zip"))
    .sort((a, b) => a.localeCompare(b))
    .map((name) => path.join(dirPath, name));
}

async function ingestZip({
  zipPath,
  requestedDir,
  baseDir,
  merge,
  strict,
  dryRun,
  replace,
  envFile,
  envName,
}: {
  zipPath: string;
  requestedDir: string;
  baseDir: string;
  merge: boolean;
  strict: boolean;
  dryRun: boolean;
  replace: boolean;
  envFile?: string;
  envName?: string;
}): Promise<void> {
  const zipInfo = await stat(zipPath).catch(() => null);
  if (!zipInfo?.isFile()) throw new Error(`Zip not found: ${zipPath}`);

  const seedName = path.basename(zipPath).replace(/\.zip$/i, "");
  const fallbackDir = requestedDir || path.join(baseDir, `${seedName}.${Date.now()}`);
  const tempDir = `${fallbackDir}.tmp`;

  await extractZip(zipPath, tempDir, { maxBytes: MAX_SUBMISSION_BYTES });

  const manifestPath = path.join(tempDir, "manifest.json");
  let finalDir = requestedDir || fallbackDir;
  if (!requestedDir && (await fileExists(manifestPath))) {
    try {
      const raw = await readFile(manifestPath, "utf8");
      const parsed = JSON.parse(raw) as { submissionId?: string; createdAt?: string };
      const submissionId =
        typeof parsed.submissionId === "string" ? parsed.submissionId.trim() : "";
      const createdAt =
        typeof parsed.createdAt === "string" ? parsed.createdAt.trim() : "";
      const datePart = createdAt.length >= 10 ? createdAt.slice(0, 10) : "";
      if (submissionId) {
        const folderName = datePart
          ? `submission.${datePart}.${submissionId}`
          : `submission.${submissionId}`;
        finalDir = path.join(baseDir, folderName);
      }
    } catch {
      // ignore manifest parse errors
    }
  }

  if (await fileExists(finalDir)) {
    finalDir = `${finalDir}.${Date.now()}`;
  }
  await mkdir(path.dirname(finalDir), { recursive: true });
  await rename(tempDir, finalDir);

  const productsCsvPath = path.join(finalDir, "products.csv");
  if (!(await fileExists(productsCsvPath))) {
    throw new Error('Submission is missing "products.csv".');
  }

  const rows = await readCsv(productsCsvPath);
  if (rows.length < 1 || rows.length > 10) {
    throw new Error(`Submission must contain 1–10 products (found ${rows.length}).`);
  }

  const root = process.cwd();
  const validateScript = path.join(root, "scripts", "src", "xa", "validate-xa-inputs.ts");
  const pipelineScript = path.join(root, "scripts", "src", "xa", "run-xa-pipeline.ts");

  const catalogOutPath = path.join(root, "apps", "xa", "src", "data", "catalog.json");
  const mediaOutPath = path.join(root, "apps", "xa", "src", "data", "catalog.media.json");

  const validateArgs = ["--products", productsCsvPath];
  if (strict) validateArgs.push("--strict");
  await runNodeTsx(validateScript, validateArgs);

  const statePath = path.join(finalDir, ".xa-upload-state.json");
  const backupDir = path.join(finalDir, "backups");
  await mkdir(backupDir, { recursive: true });

  const pipelineArgs = [
    "--products",
    productsCsvPath,
    "--simple",
    "--out",
    catalogOutPath,
    "--media-out",
    mediaOutPath,
    "--state",
    statePath,
    "--backup",
    "--backup-dir",
    backupDir,
  ];
  if (merge) pipelineArgs.push("--merge", "--base-catalog", catalogOutPath);
  if (replace) pipelineArgs.push("--replace");
  if (dryRun) pipelineArgs.push("--dry-run");
  if (strict) pipelineArgs.push("--strict");
  if (envFile) pipelineArgs.push("--env-file", envFile);
  if (envName) pipelineArgs.push("--env", envName);

  await runNodeTsx(pipelineScript, pipelineArgs);
  console.log(`Ingested ${path.basename(zipPath)} -> ${path.relative(root, finalDir)}`);
}

async function main(): Promise<void> {
  const { values } = parseArgs({
    options: {
      zip: { type: "string", multiple: true },
      dir: { type: "string" },
      dest: { type: "string" },
      merge: { type: "boolean", default: true },
      strict: { type: "boolean", default: true },
      "dry-run": { type: "boolean", default: false },
      replace: { type: "boolean", default: false },
      "env-file": { type: "string" },
      env: { type: "string" },
      help: { type: "boolean", default: false },
    },
  });

  if (values.help) {
    printUsage();
    return;
  }

  const zipArgs = (values.zip ?? []).map((value) => String(value)).filter(Boolean);
  const dirArg = values.dir ? String(values.dir) : "";
  const destArg = values.dest ? path.resolve(String(values.dest)) : "";

  const fromDir = dirArg ? await listZipFiles(path.resolve(dirArg)) : [];
  const zipPaths = [...zipArgs.map((value) => path.resolve(value)), ...fromDir];

  if (!zipPaths.length) {
    printUsage();
    throw new Error("Provide --zip <submission.zip> or --dir <folder>.");
  }

  const uniqueZipPaths = Array.from(new Set(zipPaths));
  const multiple = uniqueZipPaths.length > 1;

  const strict = Boolean(values.strict);
  const dryRun = Boolean(values["dry-run"]);
  const replace = Boolean(values.replace);
  const merge = Boolean(values.merge);
  const envFile = values["env-file"] ? String(values["env-file"]) : undefined;
  const envName = values.env ? String(values.env) : undefined;

  const inboxDir = path.resolve(DEFAULT_INBOX_DIR);
  const baseDir = multiple && destArg ? destArg : inboxDir;
  const requestedDir = !multiple && destArg ? destArg : "";

  await mkdir(baseDir, { recursive: true });
  for (const zipPath of uniqueZipPaths) {
    await ingestZip({
      zipPath,
      requestedDir,
      baseDir,
      merge,
      strict,
      dryRun,
      replace,
      envFile,
      envName,
    });
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
