import { execSync, spawnSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptFilePath = fileURLToPath(import.meta.url);
const scriptDir = path.dirname(scriptFilePath);
const appRoot = path.resolve(scriptDir, "..");
const fallbackCatalogPath = path.join(appRoot, "src", "data", "catalog.json");
const fallbackMediaIndexPath = path.join(appRoot, "src", "data", "catalog.media.json");
const runtimeCatalogPath = path.join(appRoot, "src", "data", "catalog.runtime.json");
const runtimeMediaIndexPath = path.join(appRoot, "src", "data", "catalog.media.runtime.json");
const runtimeMetaPath = path.join(appRoot, "src", "data", "catalog.runtime.meta.json");

function resolveCatalogReadUrl() {
  const explicit = (process.env.XA_CATALOG_CONTRACT_READ_URL ?? "").trim();
  if (explicit) return explicit;

  const base = (process.env.XA_CATALOG_CONTRACT_BASE_URL ?? "").trim();
  if (!base) return "";
  try {
    const normalized = base.endsWith("/") ? base : `${base}/`;
    return new URL("xa-b", normalized).toString();
  } catch {
    return "";
  }
}

function resolveCatalogReadTimeoutMs() {
  const raw = Number(process.env.XA_CATALOG_CONTRACT_READ_TIMEOUT_MS ?? "15000");
  if (!Number.isFinite(raw) || raw <= 0) return 15_000;
  return Math.round(raw);
}

function requireCatalogReadSuccess() {
  const raw = (process.env.XA_CATALOG_CONTRACT_READ_REQUIRED ?? "").trim().toLowerCase();
  if (["1", "true", "yes"].includes(raw)) return true;
  if (["0", "false", "no"].includes(raw)) return false;
  return process.env.NODE_ENV === "production";
}

async function ensureRuntimeCatalogSeed() {
  try {
    await fs.access(runtimeCatalogPath);
    return;
  } catch {
    // Fall through.
  }

  const fallbackRaw = await fs.readFile(fallbackCatalogPath, "utf8");
  await fs.writeFile(runtimeCatalogPath, fallbackRaw, "utf8");

  try {
    await fs.access(runtimeMediaIndexPath);
  } catch {
    const fallbackMediaRaw = await fs
      .readFile(fallbackMediaIndexPath, "utf8")
      .catch(() => JSON.stringify({ generatedAt: null, totals: { products: 0, media: 0, warnings: 0 }, items: [] }));
    await fs.writeFile(runtimeMediaIndexPath, `${fallbackMediaRaw.trim()}\n`, "utf8");
  }
}

async function writeRuntimeMeta(meta) {
  const tempPath = `${runtimeMetaPath}.tmp`;
  await fs.writeFile(tempPath, `${JSON.stringify(meta, null, 2)}\n`, "utf8");
  await fs.rename(tempPath, runtimeMetaPath);
}

function isRecord(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

async function syncCatalogFromContract() {
  await ensureRuntimeCatalogSeed();

  const readUrl = resolveCatalogReadUrl();
  if (!readUrl) {
    if (requireCatalogReadSuccess()) {
      throw new Error("[xa-build] catalog contract read URL not configured.");
    }
    console.log("[xa-build] catalog contract read URL not configured; using local runtime catalog seed.");
    await writeRuntimeMeta({
      source: "fallback",
      reason: "read_url_unconfigured",
      syncedAt: new Date().toISOString(),
      required: false,
    });
    return;
  }

  const readToken = (process.env.XA_CATALOG_CONTRACT_READ_TOKEN ?? "").trim();
  const headers = readToken ? { "X-XA-Catalog-Token": readToken } : {};
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), resolveCatalogReadTimeoutMs());

  let response;
  try {
    response = await fetch(readUrl, {
      method: "GET",
      headers,
      signal: controller.signal,
    });
  } catch (error) {
    clearTimeout(timeout);
    const message = error instanceof Error ? error.message : String(error);
    if (requireCatalogReadSuccess()) {
      throw new Error(`[xa-build] failed to fetch catalog contract: ${message}`);
    }
    console.warn(`[xa-build] failed to fetch catalog contract: ${message}; using existing runtime catalog.`);
    await writeRuntimeMeta({
      source: "fallback",
      reason: "fetch_failed",
      details: message,
      syncedAt: new Date().toISOString(),
      required: false,
      readUrl,
    });
    return;
  }
  clearTimeout(timeout);

  if (!response.ok) {
    const details = await response.text().catch(() => "");
    const trimmed = details.trim();
    const message = `[xa-build] catalog contract returned ${response.status}${trimmed ? `: ${trimmed.slice(0, 256)}` : ""}`;
    if (requireCatalogReadSuccess()) {
      throw new Error(message);
    }
    console.warn(`${message}; using existing runtime catalog.`);
    await writeRuntimeMeta({
      source: "fallback",
      reason: "http_error",
      status: response.status,
      syncedAt: new Date().toISOString(),
      required: false,
      readUrl,
    });
    return;
  }

  let payload;
  try {
    payload = await response.json();
  } catch {
    if (requireCatalogReadSuccess()) {
      throw new Error("[xa-build] catalog contract response was not valid JSON.");
    }
    console.warn("[xa-build] catalog contract response was not valid JSON; using existing runtime catalog.");
    await writeRuntimeMeta({
      source: "fallback",
      reason: "invalid_json",
      syncedAt: new Date().toISOString(),
      required: false,
      readUrl,
    });
    return;
  }

  const catalog = isRecord(payload) && isRecord(payload.catalog) ? payload.catalog : null;
  if (!catalog) {
    if (requireCatalogReadSuccess()) {
      throw new Error("[xa-build] catalog contract response missing catalog object.");
    }
    console.warn("[xa-build] catalog contract response missing catalog object; using existing runtime catalog.");
    await writeRuntimeMeta({
      source: "fallback",
      reason: "missing_catalog",
      syncedAt: new Date().toISOString(),
      required: false,
      readUrl,
    });
    return;
  }
  const mediaIndex = isRecord(payload) && isRecord(payload.mediaIndex) ? payload.mediaIndex : null;
  if (!mediaIndex && requireCatalogReadSuccess()) {
    throw new Error("[xa-build] catalog contract response missing mediaIndex object.");
  }

  const next = `${JSON.stringify(catalog, null, 2)}\n`;
  const tempPath = `${runtimeCatalogPath}.tmp`;
  const mediaIndexNext = `${JSON.stringify(mediaIndex ?? { generatedAt: null, totals: { products: 0, media: 0, warnings: 0 }, items: [] }, null, 2)}\n`;
  const mediaIndexTempPath = `${runtimeMediaIndexPath}.tmp`;
  await fs.writeFile(tempPath, next, "utf8");
  await fs.writeFile(mediaIndexTempPath, mediaIndexNext, "utf8");
  await fs.rename(tempPath, runtimeCatalogPath);
  await fs.rename(mediaIndexTempPath, runtimeMediaIndexPath);
  await writeRuntimeMeta({
    source: "contract",
    syncedAt: new Date().toISOString(),
    readUrl,
    version: isRecord(payload) && typeof payload.version === "string" ? payload.version : undefined,
    publishedAt:
      isRecord(payload) && typeof payload.publishedAt === "string" ? payload.publishedAt : undefined,
    hasMediaIndex: Boolean(mediaIndex),
  });
  console.log(`[xa-build] synced runtime catalog from contract: ${readUrl}`);
}

function resolveFromEnv() {
  const candidates = [
    "CF_PAGES_COMMIT_SHA",
    "GITHUB_SHA",
    "VERCEL_GIT_COMMIT_SHA",
    "COMMIT_SHA",
    "SOURCE_VERSION",
    "CI_COMMIT_SHA",
    "CI_COMMIT_ID",
  ];
  for (const key of candidates) {
    const value = (process.env[key] ?? "").trim();
    if (!value) continue;
    if (/^[0-9a-f]{40}$/i.test(value)) return value.slice(0, 12);
    return value;
  }
  return "";
}

function resolveFromGit() {
  try {
    return execSync("git rev-parse --short=12 HEAD", { encoding: "utf8" }).trim();
  } catch {
    return "";
  }
}

async function main() {
  await syncCatalogFromContract();

  const existing = (process.env.NEXT_PUBLIC_XA_SW_VERSION ?? "").trim();
  const resolved =
    existing || resolveFromEnv() || resolveFromGit() || Date.now().toString(36);

  const env = {
    ...process.env,
    NEXT_PUBLIC_XA_SW_VERSION: resolved,
  };

  const pnpmCmd = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
  // Next.js 16 enables Turbopack by default. XA apps inherit a shared `webpack`
  // config from @acme/next-config, so we must opt into webpack explicitly until
  // that config is migrated.
  const result = spawnSync(pnpmCmd, ["exec", "next", "build", "--webpack"], {
    stdio: "inherit",
    env,
  });

  process.exit(result.status ?? 1);
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exit(1);
});
