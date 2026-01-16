import { createWriteStream } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import { parseArgs } from "node:util";
import crypto from "node:crypto";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import type { ReadableStream as NodeReadableStream } from "node:stream/web";

import {
  encodeS3Key,
  loadR2Config,
  loadXaEnvCandidates,
  parseListObjectsV2,
  resolveR2Host,
  signR2Request,
  type R2ListObject,
} from "./xa-r2-utils";

type ProcessedEntry = {
  key: string;
  etag: string;
  size: number;
  lastModified: string;
  processedAt: string;
};

type ProcessedState = {
  processedByKey: Record<string, ProcessedEntry>;
};

const DEFAULT_INBOX_DIR = path.join("apps", "xa-uploader", "data", "inbox");
const DEFAULT_PROCESSED_FILE = path.join(DEFAULT_INBOX_DIR, ".xa-r2-processed.json");
const DEFAULT_DOWNLOAD_DIR = path.join(DEFAULT_INBOX_DIR, "r2-downloads");

function printUsage() {
  console.log(
    [
      "Usage:",
      "  XA_R2_ACCOUNT_ID=... XA_R2_BUCKET=... XA_R2_ACCESS_KEY_ID=... XA_R2_SECRET_ACCESS_KEY=... \\",
      "  XA_CLOUDFLARE_ACCOUNT_ID=... XA_CLOUDFLARE_IMAGES_TOKEN=... \\",
      "  node --import tsx scripts/src/xa/r2/ingest-xa-r2-submissions.ts [--prefix submissions/] [--max <n>] [--processed <file>] [--download-dir <dir>] [--dry-run] [--replace] [--strict] [--env-file <path>] [--env <name>]",
      "",
      "This script lists ZIP submissions in R2, downloads unprocessed objects, then runs:",
      "  pnpm xa:ingest-submission --zip <downloaded.zip>",
    ].join("\n"),
  );
}

function sanitizeBaseName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(0, 80);
}

function localZipPathForKey(downloadDir: string, key: string): string {
  const hash = crypto.createHash("sha256").update(key).digest("hex").slice(0, 16);
  const base = sanitizeBaseName(path.basename(key) || "submission.zip");
  return path.join(downloadDir, `${hash}.${base}`);
}

async function readProcessedState(filePath: string): Promise<ProcessedState> {
  const raw = await readFile(filePath, "utf8").catch(() => "");
  if (!raw) return { processedByKey: {} };
  try {
    const parsed = JSON.parse(raw) as ProcessedState;
    if (!parsed?.processedByKey) return { processedByKey: {} };
    return parsed;
  } catch {
    return { processedByKey: {} };
  }
}

async function writeProcessedState(filePath: string, state: ProcessedState): Promise<void> {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(state, null, 2)}\n`, "utf8");
}

async function listR2Objects(config: {
  host: string;
  bucket: string;
  prefix: string;
  accessKeyId: string;
  secretAccessKey: string;
}): Promise<R2ListObject[]> {
  const out: R2ListObject[] = [];
  let continuation: string | null = null;

  while (true) {
    const params = new URLSearchParams({ "list-type": "2", prefix: config.prefix });
    if (continuation) params.set("continuation-token", continuation);
    const requestPath = `/${config.bucket}?${params.toString()}`;

    const signed = signR2Request({
      host: config.host,
      method: "GET",
      path: requestPath,
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    });

    const url = `https://${config.host}${signed.path}`;
    const res = await fetch(url, {
      method: "GET",
      headers: signed.headers,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`R2 list failed (${res.status}): ${text.slice(0, 300)}`);
    }

    const xml = await res.text();
    const parsed = parseListObjectsV2(xml);
    out.push(...parsed.objects);
    if (!parsed.isTruncated || !parsed.nextContinuationToken) break;
    continuation = parsed.nextContinuationToken;
  }

  return out;
}

async function downloadR2Object(config: {
  host: string;
  bucket: string;
  key: string;
  accessKeyId: string;
  secretAccessKey: string;
  outPath: string;
}): Promise<void> {
  const encodedKey = encodeS3Key(config.key);
  const requestPath = `/${config.bucket}/${encodedKey}`;
  const signed = signR2Request({
    host: config.host,
    method: "GET",
    path: requestPath,
    accessKeyId: config.accessKeyId,
    secretAccessKey: config.secretAccessKey,
  });

  const url = `https://${config.host}${signed.path}`;
  const res = await fetch(url, { method: "GET", headers: signed.headers });
  if (!res.ok || !res.body) {
    const text = await res.text().catch(() => "");
    throw new Error(`R2 download failed (${res.status}): ${text.slice(0, 300)}`);
  }

  await mkdir(path.dirname(config.outPath), { recursive: true });
  // Cast the fetch body to the Node stream variant so pipeline accepts it.
  const bodyStream = Readable.fromWeb(res.body as unknown as NodeReadableStream);
  await pipeline(bodyStream, createWriteStream(config.outPath));
}

async function runIngestSubmission(args: {
  zipPath: string;
  strict: boolean;
  dryRun: boolean;
  replace: boolean;
  envFile?: string;
  envName?: string;
}): Promise<void> {
  const scriptPath = path.join(process.cwd(), "scripts", "src", "xa", "ingest-xa-submission.ts");
  const cliArgs = ["--zip", args.zipPath];
  if (args.strict) cliArgs.push("--strict");
  if (args.dryRun) cliArgs.push("--dry-run");
  if (args.replace) cliArgs.push("--replace");
  if (args.envFile) cliArgs.push("--env-file", args.envFile);
  if (args.envName) cliArgs.push("--env", args.envName);

  await new Promise<void>((resolve, reject) => {
    const child = spawn(process.execPath, ["--import", "tsx", scriptPath, ...cliArgs], {
      stdio: "inherit",
      env: process.env,
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`ingest-xa-submission exited with code ${code}`));
    });
  });
}

async function main(): Promise<void> {
  const { values } = parseArgs({
    options: {
      prefix: { type: "string" },
      max: { type: "string" },
      processed: { type: "string" },
      "download-dir": { type: "string" },
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

  const envFile = values["env-file"] ? String(values["env-file"]) : undefined;
  const envName = values.env ? String(values.env) : undefined;
  await loadXaEnvCandidates({ envFile, envName });

  const prefixArg = values.prefix ? String(values.prefix) : undefined;
  const r2 = loadR2Config({ prefix: prefixArg });
  const host = resolveR2Host(r2.accountId);

  const processedFile = values.processed ? String(values.processed) : DEFAULT_PROCESSED_FILE;
  const downloadDir = values["download-dir"] ? String(values["download-dir"]) : DEFAULT_DOWNLOAD_DIR;
  const max = Math.max(0, Number(values.max ?? 0) || 0);
  const strict = Boolean(values.strict);
  const dryRun = Boolean(values["dry-run"]);
  const replace = Boolean(values.replace);

  const processedState = await readProcessedState(processedFile);

  const objects = await listR2Objects({
    host,
    bucket: r2.bucket,
    prefix: r2.prefix.replace(/^\/+/, ""),
    accessKeyId: r2.accessKeyId,
    secretAccessKey: r2.secretAccessKey,
  });

  const candidates = objects
    .filter((obj) => obj.key.toLowerCase().endsWith(".zip"))
    .sort((a, b) => a.lastModified.localeCompare(b.lastModified));

  const todo = candidates.filter((obj) => {
    const prev = processedState.processedByKey[obj.key];
    return !prev || prev.etag !== obj.etag || prev.size !== obj.size;
  });

  const selected = max > 0 ? todo.slice(0, max) : todo;
  if (!selected.length) {
    console.log("No new submissions to ingest.");
    return;
  }

  console.log(`Found ${selected.length} unprocessed submission(s).`);

  for (const obj of selected) {
    const outPath = localZipPathForKey(downloadDir, obj.key);
    console.log(`Downloading ${obj.key} -> ${outPath}`);
    await downloadR2Object({
      host,
      bucket: r2.bucket,
      key: obj.key,
      accessKeyId: r2.accessKeyId,
      secretAccessKey: r2.secretAccessKey,
      outPath,
    });

    await runIngestSubmission({
      zipPath: outPath,
      strict,
      dryRun,
      replace,
      envFile,
      envName,
    });

    processedState.processedByKey[obj.key] = {
      key: obj.key,
      etag: obj.etag,
      size: obj.size,
      lastModified: obj.lastModified,
      processedAt: new Date().toISOString(),
    };
    await writeProcessedState(processedFile, processedState);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
