/* eslint-disable security/detect-non-literal-fs-filename -- XAUP-0001 [ttl=2026-12-31] temp paths derived from validated inputs */
import { spawn } from "node:child_process";
import path from "node:path";
import fs from "node:fs/promises";

import { NextResponse } from "next/server";

import { hasUploaderSession } from "../../../../lib/uploaderAuth";
import { resolveXaUploaderProductsCsvPath } from "../../../../lib/catalogCsv";
import { parseStorefront } from "../../../../lib/catalogStorefront.ts";
import { resolveStorefrontCatalogPaths } from "../../../../lib/catalogStorefront.server";
import { resolveRepoRoot } from "../../../../lib/repoRoot";

export const runtime = "nodejs";

type SyncOptions = {
  strict?: boolean;
  dryRun?: boolean;
  replace?: boolean;
  recursive?: boolean;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

async function runNodeTsx(repoRoot: string, scriptPath: string, args: string[]) {
  return await new Promise<{ code: number; stdout: string; stderr: string }>((resolve) => {
    const child = spawn(process.execPath, ["--import", "tsx", scriptPath, ...args], {
      cwd: repoRoot,
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
    });

    const stdoutChunks: Buffer[] = [];
    const stderrChunks: Buffer[] = [];
    child.stdout.on("data", (chunk: Buffer) => stdoutChunks.push(chunk));
    child.stderr.on("data", (chunk: Buffer) => stderrChunks.push(chunk));
    child.on("close", (code) => {
      resolve({
        code: code ?? 1,
        stdout: Buffer.concat(stdoutChunks).toString("utf8"),
        stderr: Buffer.concat(stderrChunks).toString("utf8"),
      });
    });
  });
}

export async function POST(request: Request) {
  if (process.env.XA_UPLOADER_MODE === "vendor") {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  const authenticated = await hasUploaderSession(request);
  if (!authenticated) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  let options: SyncOptions = {};
  let storefront: string | null = null;
  try {
    const payload = await request.json().catch(() => null);
    if (isRecord(payload) && isRecord(payload.options)) {
      options = payload.options as SyncOptions;
    }
    if (isRecord(payload) && typeof payload.storefront === "string") {
      storefront = payload.storefront;
    }
  } catch {
    options = {};
  }

  const startedAt = Date.now();
  const repoRoot = resolveRepoRoot();

  const storefrontId = parseStorefront(storefront);
  const productsCsvPath = resolveXaUploaderProductsCsvPath(storefrontId);
  const uploaderDataDir = path.join(repoRoot, "apps", "xa-uploader", "data");
  const statePath = path.join(uploaderDataDir, `.xa-upload-state.${storefrontId}.json`);
  const backupDir = path.join(uploaderDataDir, "backups", storefrontId);
  await fs.mkdir(uploaderDataDir, { recursive: true });
  await fs.mkdir(backupDir, { recursive: true });

  const { catalogOutPath, mediaOutPath } = resolveStorefrontCatalogPaths(storefrontId);

  const strict = Boolean(options.strict);
  const dryRun = Boolean(options.dryRun);
  const replace = Boolean(options.replace);
  const recursive = Boolean(options.recursive);

  const validateScript = path.join(repoRoot, "scripts", "src", "xa", "validate-xa-inputs.ts");
  const syncScript = path.join(repoRoot, "scripts", "src", "xa", "run-xa-pipeline.ts");

  const validateArgs = ["--products", productsCsvPath];
  if (recursive) validateArgs.push("--recursive");
  if (strict) validateArgs.push("--strict");

  const syncArgs = [
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
  if (replace) syncArgs.push("--replace");
  if (recursive) syncArgs.push("--recursive");
  if (dryRun) syncArgs.push("--dry-run");
  if (strict) syncArgs.push("--strict");

  const validateResult = await runNodeTsx(repoRoot, validateScript, validateArgs);
  if (validateResult.code !== 0) {
    return NextResponse.json(
      {
        ok: false,
        error: "validation_failed",
        durationMs: Date.now() - startedAt,
        logs: { validate: validateResult },
      },
      { status: 400 },
    );
  }

  const syncResult = await runNodeTsx(repoRoot, syncScript, syncArgs);
  if (syncResult.code !== 0) {
    return NextResponse.json(
      {
        ok: false,
        error: "sync_failed",
        durationMs: Date.now() - startedAt,
        logs: { validate: validateResult, sync: syncResult },
      },
      { status: 400 },
    );
  }

  return NextResponse.json({
    ok: true,
    durationMs: Date.now() - startedAt,
    logs: { validate: validateResult, sync: syncResult },
  });
}
