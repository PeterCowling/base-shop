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
const pagesWorkerTemplatePath = path.join(scriptDir, "pages-worker.js");
const pagesWorkerOutputPath = path.join(appRoot, "out", "_worker.js");
const PAGES_WORKER_CONNECT_SRC_TOKEN = "__XA_EXTRA_CONNECT_SRC__";

function parseEnvLine(line) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) return null;

  const withoutExport = trimmed.startsWith("export ")
    ? trimmed.slice("export ".length).trim()
    : trimmed;
  const separatorIndex = withoutExport.indexOf("=");
  if (separatorIndex <= 0) return null;

  const key = withoutExport.slice(0, separatorIndex).trim();
  if (!key) return null;
  let value = withoutExport.slice(separatorIndex + 1).trim();

  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  }

  return { key, value };
}

async function loadBuildEnvFiles() {
  const candidates = [".env.local", ".env"];
  for (const candidate of candidates) {
    const filePath = path.join(appRoot, candidate);
    let raw;
    try {
      raw = await fs.readFile(filePath, "utf8");
    } catch {
      continue;
    }

    for (const line of raw.split(/\r?\n/)) {
      const parsed = parseEnvLine(line);
      if (!parsed) continue;
      if (Object.prototype.hasOwnProperty.call(process.env, parsed.key)) continue;
      process.env[parsed.key] = parsed.value;
    }
  }
}

function resolveStealthMode() {
  const raw = (
    process.env.XA_STEALTH_MODE ??
    process.env.STEALTH_MODE ??
    process.env.NEXT_PUBLIC_STEALTH_MODE ??
    ""
  )
    .trim()
    .toLowerCase();
  return ["1", "true", "yes", "on"].includes(raw);
}

function resolveSiteConfigPreflightMode() {
  const raw = (process.env.XA_SITE_CONFIG_PREFLIGHT_MODE ?? "").trim().toLowerCase();
  if (raw === "off") return "off";
  if (raw === "strict") return "strict";
  if (raw === "warn") return "warn";
  if (process.env.CI || process.env.CF_PAGES) return "strict";
  return "warn";
}

function isPlaceholderValue(value) {
  const normalized = value.trim().toLowerCase();
  if (!normalized) return true;
  if (
    normalized.includes("example.com") ||
    normalized.includes("your legal entity") ||
    normalized.includes("your registered address") ||
    normalized.includes("your jurisdiction") ||
    normalized.includes("placeholder") ||
    normalized.includes("changeme") ||
    normalized.includes("replace")
  ) {
    return true;
  }
  return false;
}

function resolvePublicConfigSnapshot() {
  return {
    brandName: (process.env.NEXT_PUBLIC_BRAND_NAME ?? "XA-B").trim(),
    domain:
      (process.env.NEXT_PUBLIC_SITE_DOMAIN ?? process.env.NEXT_PUBLIC_DOMAIN ?? "example.com")
        .trim()
        .replace(/^https?:\/\//i, ""),
    legalEntityName: (process.env.NEXT_PUBLIC_LEGAL_ENTITY_NAME ?? "Your Legal Entity Name").trim(),
    legalAddress: (process.env.NEXT_PUBLIC_LEGAL_ADDRESS ?? "Your registered address").trim(),
    supportEmail: (process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "support@example.com").trim(),
    whatsappNumber: (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "+00 000 000 000").trim(),
    instagramUrl: (process.env.NEXT_PUBLIC_INSTAGRAM_URL ?? "https://instagram.com/xa").trim(),
    jurisdiction: (process.env.NEXT_PUBLIC_JURISDICTION ?? "Your jurisdiction").trim(),
  };
}

function runSiteConfigPreflight() {
  const mode = resolveSiteConfigPreflightMode();
  if (mode === "off") return;
  if (resolveStealthMode()) {
    console.log("[xa-build] site config preflight skipped (stealth mode enabled).");
    return;
  }

  const snapshot = resolvePublicConfigSnapshot();
  const failures = [];
  const notes = [];

  if (isPlaceholderValue(snapshot.brandName) || snapshot.brandName === "XA-B") {
    failures.push("NEXT_PUBLIC_BRAND_NAME must be set to your production brand name.");
  }

  if (isPlaceholderValue(snapshot.domain) || !snapshot.domain.includes(".")) {
    failures.push("NEXT_PUBLIC_SITE_DOMAIN (or NEXT_PUBLIC_DOMAIN) must be a real public domain.");
  }

  if (isPlaceholderValue(snapshot.legalEntityName)) {
    failures.push("NEXT_PUBLIC_LEGAL_ENTITY_NAME must be set.");
  }

  if (isPlaceholderValue(snapshot.legalAddress)) {
    failures.push("NEXT_PUBLIC_LEGAL_ADDRESS must be set.");
  }

  if (isPlaceholderValue(snapshot.supportEmail) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(snapshot.supportEmail)) {
    failures.push("NEXT_PUBLIC_SUPPORT_EMAIL must be a valid support inbox.");
  }

  if (
    isPlaceholderValue(snapshot.whatsappNumber) ||
    snapshot.whatsappNumber === "+00 000 000 000"
  ) {
    failures.push("NEXT_PUBLIC_WHATSAPP_NUMBER must be set to a real support number.");
  }

  if (isPlaceholderValue(snapshot.instagramUrl) || !/^https?:\/\//i.test(snapshot.instagramUrl)) {
    notes.push("NEXT_PUBLIC_INSTAGRAM_URL is not configured with a production profile URL.");
  }

  if (isPlaceholderValue(snapshot.jurisdiction)) {
    notes.push("NEXT_PUBLIC_JURISDICTION should be set before legal pages go live.");
  }

  if (failures.length === 0 && notes.length === 0) return;

  const lines = [
    "[xa-build] site config preflight findings:",
    ...failures.map((message) => `  - FAIL: ${message}`),
    ...notes.map((message) => `  - WARN: ${message}`),
  ];

  if (mode === "strict" && failures.length > 0) {
    throw new Error(lines.join("\n"));
  }

  console.warn(lines.join("\n"));
}

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

function resolvePagesWorkerConnectSrc() {
  const rawUrl = (process.env.NEXT_PUBLIC_XA_CATALOG_PUBLIC_URL ?? "").trim();
  if (!rawUrl) return "";
  try {
    const origin = new URL(rawUrl).origin;
    return origin ? ` ${origin}` : "";
  } catch {
    return "";
  }
}

function parseBooleanEnv(value) {
  const normalized = (value ?? "").trim().toLowerCase();
  return ["1", "true", "yes", "on"].includes(normalized);
}

function isCiOrPagesBuild() {
  return Boolean((process.env.CI ?? "").trim() || (process.env.CF_PAGES ?? "").trim());
}

function allowLocalArtifactFallback() {
  if (isCiOrPagesBuild()) return false;
  return parseBooleanEnv(process.env.ALLOW_LOCAL_ARTIFACT_FALLBACK);
}

function requireCatalogReadSuccess() {
  // Contract-read is strict by default. The only non-strict mode is explicit
  // local-dev fallback (never enabled in CI/CF Pages builds).
  if (allowLocalArtifactFallback()) return false;

  const raw = (process.env.XA_CATALOG_CONTRACT_READ_REQUIRED ?? "").trim().toLowerCase();
  if (["1", "true", "yes"].includes(raw)) return true;
  if (["0", "false", "no"].includes(raw) && !isCiOrPagesBuild()) return false;
  return true;
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
  const sanitized = {};
  if (typeof meta?.source === "string") sanitized.source = meta.source;
  if (typeof meta?.reason === "string") sanitized.reason = meta.reason;
  if (typeof meta?.syncedAt === "string") sanitized.syncedAt = meta.syncedAt;
  if (typeof meta?.version === "string") sanitized.version = meta.version;
  if (typeof meta?.publishedAt === "string") sanitized.publishedAt = meta.publishedAt;
  if (typeof meta?.artifactId === "string") sanitized.artifactId = meta.artifactId;
  if (typeof meta?.required === "boolean") sanitized.required = meta.required;
  if (typeof meta?.hasMediaIndex === "boolean") sanitized.hasMediaIndex = meta.hasMediaIndex;
  if (Number.isFinite(meta?.productCount)) sanitized.productCount = Math.max(0, Math.trunc(meta.productCount));
  if (Number.isFinite(meta?.status)) sanitized.status = Math.max(100, Math.trunc(meta.status));

  const tempPath = `${runtimeMetaPath}.tmp`;
  await fs.writeFile(tempPath, `${JSON.stringify(sanitized, null, 2)}\n`, "utf8");
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
      throw new Error(
        "[xa-build] catalog contract read URL not configured. Set XA_CATALOG_CONTRACT_READ_URL (or XA_CATALOG_CONTRACT_BASE_URL), or enable ALLOW_LOCAL_ARTIFACT_FALLBACK=1 for local development only.",
      );
    }

    // Try local sync artifacts from xa-uploader before falling back to committed catalog.json
    const localArtifactPath = path.resolve(scriptDir, "../../xa-uploader/data/sync-artifacts/xa-b/catalog.json");
    const localMediaArtifactPath = path.resolve(scriptDir, "../../xa-uploader/data/sync-artifacts/xa-b/catalog.media.json");
    try {
      const localRaw = await fs.readFile(localArtifactPath, "utf8");
      const localCatalog = JSON.parse(localRaw);
      if (isRecord(localCatalog) && Array.isArray(localCatalog.products)) {
        const next = `${JSON.stringify(localCatalog, null, 2)}\n`;
        const tempPath = `${runtimeCatalogPath}.tmp`;
        await fs.writeFile(tempPath, next, "utf8");
        await fs.rename(tempPath, runtimeCatalogPath);

        // Also copy media index if present
        try {
          const localMediaRaw = await fs.readFile(localMediaArtifactPath, "utf8");
          const mediaIndexTempPath = `${runtimeMediaIndexPath}.tmp`;
          await fs.writeFile(mediaIndexTempPath, `${localMediaRaw.trim()}\n`, "utf8");
          await fs.rename(mediaIndexTempPath, runtimeMediaIndexPath);
        } catch {
          // Media index is optional — proceed without it.
        }

        console.log(`[xa-build] using local sync artifacts (${localCatalog.products.length} products).`);
        await writeRuntimeMeta({
          source: "local-artifacts",
          artifactId: "xa-uploader/sync-artifacts/xa-b/catalog.json",
          productCount: localCatalog.products.length,
          syncedAt: new Date().toISOString(),
          required: false,
        });
        return;
      }
    } catch {
      // Local artifacts not available — fall through to committed catalog.json seed.
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
  } catch {
    clearTimeout(timeout);
    if (requireCatalogReadSuccess()) {
      throw new Error("[xa-build] failed to fetch catalog contract.");
    }
    console.warn("[xa-build] failed to fetch catalog contract; using existing runtime catalog.");
    await writeRuntimeMeta({
      source: "fallback",
      reason: "fetch_failed",
      syncedAt: new Date().toISOString(),
      required: false,
    });
    return;
  }
  clearTimeout(timeout);

  if (!response.ok) {
    const message = `[xa-build] catalog contract returned HTTP ${response.status}.`;
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
    version: isRecord(payload) && typeof payload.version === "string" ? payload.version : undefined,
    publishedAt:
      isRecord(payload) && typeof payload.publishedAt === "string" ? payload.publishedAt : undefined,
    hasMediaIndex: Boolean(mediaIndex),
  });
  console.log("[xa-build] synced runtime catalog from contract.");
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

async function syncPagesWorkerScript() {
  const source = await fs.readFile(pagesWorkerTemplatePath, "utf8");
  const next = source.replace(PAGES_WORKER_CONNECT_SRC_TOKEN, resolvePagesWorkerConnectSrc());
  await fs.mkdir(path.dirname(pagesWorkerOutputPath), { recursive: true });
  const temp = `${pagesWorkerOutputPath}.tmp`;
  await fs.writeFile(temp, next, "utf8");
  await fs.rename(temp, pagesWorkerOutputPath);
  console.log("[xa-build] synced Pages advanced-mode worker to out/_worker.js.");
}

async function main() {
  await loadBuildEnvFiles();
  runSiteConfigPreflight();
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

  const exitCode = result.status ?? 1;
  if (exitCode !== 0) {
    process.exit(exitCode);
  }

  await syncPagesWorkerScript();
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exit(1);
});
