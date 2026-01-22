/* i18n-exempt file -- PP-1100 runner script [ttl=2026-06-30] */
// apps/product-pipeline/scripts/runner.ts

import { Buffer } from "node:buffer";
import { mkdir, readFile } from "node:fs/promises";
import { basename, extname, resolve } from "node:path";
import readline from "node:readline";

import { median as libMedian } from "@acme/lib/math/statistics";

import type {
  RunnerArtifact,
  RunnerClaimResponse,
  RunnerCompleteRequest,
  RunnerError,
  RunnerJob,
} from "../src/lib/pipeline/runner-contract";

const args = new Set(process.argv.slice(2));

const DEFAULT_USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
const DEFAULT_ACCEPT_LANGUAGE = "en-US,en;q=0.9";
const DEFAULT_CAPTURE_TIMEOUT_MS = 15000;
const DEFAULT_HUMAN_GATE_MESSAGE =
  "Stage M human-gate: complete any login/scroll then press Enter to capture (s to skip)";
const AMAZON_MARKETPLACE_DOMAINS: Record<string, string> = {
  de: "amazon.de",
  fr: "amazon.fr",
  it: "amazon.it",
  es: "amazon.es",
  nl: "amazon.nl",
  se: "amazon.se",
  pl: "amazon.pl",
  be: "amazon.com.be",
  ie: "amazon.ie",
  uk: "amazon.co.uk",
  gb: "amazon.co.uk",
};

type CaptureMode = "fetch" | "playwright";

type StageMItem = {
  price?: unknown;
  reviews?: unknown;
  sponsored?: unknown;
};

type CaptureMeta = {
  mode: CaptureMode;
  headless: boolean;
  humanGate: boolean;
  humanGateOutcome?: "accepted" | "declined";
  playbook?: string | null;
  waitSelector?: string | null;
  scrollSteps?: number | null;
  postNavWaitMs?: number | null;
  sessionProfile?: string | null;
  userDataDir?: string | null;
  captureUrl?: string | null;
  sourceUrl?: string | null;
  durationMs?: number | null;
  cookieSelectorsUsed?: string[] | null;
};

type StageMOutput = {
  kind?: string;
  marketplace?: string | null;
  query?: string | null;
  url?: string | null;
  maxResults?: number | null;
  priceSample?: number[];
  priceMin?: number | null;
  priceMax?: number | null;
  priceMedian?: number | null;
  reviewMedian?: number | null;
  sponsoredShare?: number | null;
  generatedAt?: string | null;
  captureMeta?: CaptureMeta;
};

type OutputOverrideRecord = {
  jobId?: string;
  candidateId?: string;
  output?: unknown;
  items?: unknown;
};

type CaptureConfig = {
  enabled: boolean;
  upload: boolean;
  mode: CaptureMode;
  timeoutMs: number;
  userAgent: string | null;
  acceptLanguage: string | null;
  waitForSelector: string | null;
  humanGate: boolean;
  humanGateMessage: string | null;
  headless: boolean;
  screenshot: boolean;
  postNavWaitMs: number;
  scrollSteps: number;
  userDataDir: string | null;
  sessionProfile: string | null;
  playbookId: string | null;
  cookieSelectors: string[] | null;
};

type SessionRotation = "none" | "daily" | "per-job" | "per-candidate";

type SessionConfig = {
  rootDir: string | null;
  rotation: SessionRotation;
  profile: string | null;
};

type RunnerPingRequest = {
  runnerId: string;
  mode?: CaptureMode;
  headless?: boolean;
  humanGate?: boolean;
  sessionProfile?: string;
  playbook?: string;
  sessionRotation?: SessionRotation;
  claimMode?: "queue" | "runner";
  captureEnabled?: boolean;
};

type CapturePlaybook = {
  id: "amazon_search" | "amazon_listing" | "taobao_listing";
  label: string;
  waitSelector?: string;
  postNavWaitMs?: number;
  scrollSteps?: number;
  cookieSelectors?: string[];
};

function getArgValue(flag: string): string | undefined {
  const index = process.argv.indexOf(flag);
  if (index === -1) return undefined;
  return process.argv[index + 1];
}

function promptHumanGate(message: string): Promise<boolean> {
  if (!process.stdin.isTTY) {
    return Promise.resolve(true);
  }
  return new Promise((resolvePromise) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.question(`${message} [Enter=continue, s=skip] `, (answer) => {
      rl.close();
      const trimmed = answer.trim().toLowerCase();
      if (trimmed === "s" || trimmed === "skip") {
        resolvePromise(false);
        return;
      }
      resolvePromise(true);
    });
  });
}

async function ensureDir(pathValue: string | null): Promise<string | null> {
  if (!pathValue) return null;
  try {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- PP-1100 controlled output directory for capture artifacts
    await mkdir(pathValue, { recursive: true });
    return pathValue;
  } catch {
    return null;
  }
}

const PLAYBOOKS: Record<CapturePlaybook["id"], CapturePlaybook> = {
  amazon_search: {
    id: "amazon_search",
    label: "Amazon search",
    waitSelector: 'div[data-component-type="s-search-result"]',
    postNavWaitMs: 500,
    scrollSteps: 2,
    cookieSelectors: ["#sp-cc-accept", "input#sp-cc-accept", "button#sp-cc-accept"],
  },
  amazon_listing: {
    id: "amazon_listing",
    label: "Amazon listing",
    waitSelector: "#productTitle, #title",
    postNavWaitMs: 500,
    scrollSteps: 1,
    cookieSelectors: ["#sp-cc-accept", "input#sp-cc-accept", "button#sp-cc-accept"],
  },
  taobao_listing: {
    id: "taobao_listing",
    label: "Taobao listing",
    waitSelector: "#J_DetailMeta, .tb-detail-hd",
    postNavWaitMs: 800,
    scrollSteps: 1,
    cookieSelectors: [
      "#sufei-dialog-accept",
      ".sufei-dialog .sufei-dialog-btn[mt='ok']",
    ],
  },
};

function resolveSiteFromJob(job: RunnerJob): "amazon" | "taobao" {
  return job.input.kind.startsWith("amazon") ? "amazon" : "taobao";
}

function resolvePlaybookId(job: RunnerJob): CapturePlaybook["id"] {
  if (job.input.kind === "amazon_search") return "amazon_search";
  if (job.input.kind === "amazon_listing") return "amazon_listing";
  return "taobao_listing";
}

function resolvePlaybook(
  job: RunnerJob,
  override: string | null,
  enabled: boolean,
): CapturePlaybook | null {
  if (!enabled) return null;
  if (override && override !== "auto") {
    if (override in PLAYBOOKS) {
      return PLAYBOOKS[override as CapturePlaybook["id"]];
    }
    return null;
  }
  return PLAYBOOKS[resolvePlaybookId(job)];
}

function resolvePlaybookLabel(
  job: RunnerJob,
  playbook: CapturePlaybook | null,
): string {
  if (playbook?.label) return playbook.label;
  const fallback = PLAYBOOKS[resolvePlaybookId(job)];
  return fallback?.label ?? "Stage M capture";
}

function buildHumanGateMessage(
  job: RunnerJob,
  playbook: CapturePlaybook | null,
): string {
  const label = resolvePlaybookLabel(job, playbook);
  return `${label} human-gate: complete any login/scroll then press Enter to capture (s to skip)`;
}

function resolveSessionRotation(value: string | null): SessionRotation {
  if (value === "daily" || value === "per-job" || value === "per-candidate") {
    return value;
  }
  return "none";
}

function buildSessionKey(
  job: RunnerJob,
  rotation: SessionRotation,
): string {
  if (rotation === "per-job") return job.id;
  if (rotation === "per-candidate") return job.candidateId;
  if (rotation === "daily") {
    const now = new Date();
    return now.toISOString().slice(0, 10);
  }
  return "default";
}

async function resolveCaptureConfigForJob(
  job: RunnerJob,
  base: CaptureConfig,
  playbookOverride: string | null,
  playbookEnabled: boolean,
  sessionConfig: SessionConfig,
  overrides: {
    waitSelector: boolean;
    postNavWaitMs: boolean;
    scrollSteps: boolean;
    humanGate: boolean;
  },
): Promise<CaptureConfig> {
  const playbook = resolvePlaybook(job, playbookOverride, playbookEnabled);
  const config: CaptureConfig = { ...base };
  if (playbook) {
    config.playbookId = playbook.id;
    config.cookieSelectors = playbook.cookieSelectors ?? null;
    if (!overrides.waitSelector && playbook.waitSelector) {
      config.waitForSelector = playbook.waitSelector;
    }
    if (!overrides.postNavWaitMs && playbook.postNavWaitMs !== undefined) {
      config.postNavWaitMs = playbook.postNavWaitMs;
    }
    if (!overrides.scrollSteps && playbook.scrollSteps !== undefined) {
      config.scrollSteps = playbook.scrollSteps;
    }
  } else {
    config.playbookId = null;
  }

  config.sessionProfile =
    sessionConfig.profile ?? job.input.captureProfile ?? resolveSiteFromJob(job);

  if (!overrides.humanGate && config.mode !== "playwright") {
    config.humanGate = false;
  }
  config.humanGateMessage = config.humanGate
    ? buildHumanGateMessage(job, playbook)
    : null;

  if (base.userDataDir) {
    config.userDataDir = base.userDataDir;
    return config;
  }

  if (sessionConfig.rootDir) {
    const sessionKey = buildSessionKey(job, sessionConfig.rotation);
    const profile = config.sessionProfile ?? "default";
    const dir = resolve(sessionConfig.rootDir, profile, sessionKey);
    config.userDataDir = await ensureDir(dir);
  } else {
    config.userDataDir = null;
  }

  return config;
}

function parseNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return null;
  const cleaned = value.replace(/[^0-9,.-]+/g, "");
  if (!cleaned) return null;
  let normalized = cleaned;
  if (cleaned.includes(",") && !cleaned.includes(".")) {
    normalized = cleaned.replace(",", ".");
  } else if (cleaned.includes(",") && cleaned.includes(".")) {
    normalized = cleaned.replace(/,/g, "");
  }
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseBoolean(value: unknown): boolean | null {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    if (value.toLowerCase() === "true") return true;
    if (value.toLowerCase() === "false") return false;
  }
  return null;
}

/**
 * Wrapper around library median that returns null for empty arrays
 * (matching the original behavior expected by callers).
 * @see {@link libMedian} from @acme/lib/math/statistics
 */
function computeMedian(values: number[]): number | null {
  const result = libMedian(values);
  return Number.isNaN(result) ? null : result;
}

function uniqueNumbers(values: number[]): number[] {
  const seen = new Set<number>();
  const result: number[] = [];
  for (const value of values) {
    if (seen.has(value)) continue;
    seen.add(value);
    result.push(value);
  }
  return result;
}

function normalizeBaseUrl(value: string): string {
  return value.replace(/\/+$/, "");
}

function normalizeUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("//")) return `https:${trimmed}`;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function resolveAmazonDomain(marketplace: string): string {
  const trimmed = marketplace.trim().toLowerCase();
  if (!trimmed) return AMAZON_MARKETPLACE_DOMAINS.de;
  let domain = trimmed
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "");
  domain = domain.split("/")[0] ?? "";
  const mapped = AMAZON_MARKETPLACE_DOMAINS[domain] ?? AMAZON_MARKETPLACE_DOMAINS[trimmed];
  if (mapped) return mapped;
  if (domain.includes(".")) return domain;
  return `amazon.${domain}`;
}

function buildAmazonSearchUrl(marketplace: string, query: string): string {
  const domain = resolveAmazonDomain(marketplace);
  return `https://${domain}/s?k=${encodeURIComponent(query)}`;
}

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function guessContentType(path: string): string {
  const ext = extname(path).toLowerCase();
  switch (ext) {
    case ".png":
      return "image/png";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".webp":
      return "image/webp";
    case ".json":
      return "application/json";
    case ".html":
      return "text/html";
    case ".txt":
      return "text/plain";
    default:
      return "application/octet-stream";
  }
}

async function uploadArtifactBlob(
  baseUrl: string,
  blob: Blob,
  candidateId: string,
  stageRunId: string,
  kind: string,
  filename: string,
): Promise<RunnerArtifact | null> {
  const formData = new FormData();
  formData.set("candidateId", candidateId);
  formData.set("stageRunId", stageRunId);
  formData.set("kind", kind);
  formData.set("file", blob, filename);

  const response = await fetch(`${baseUrl}/api/artifacts/upload`, {
    method: "POST",
    body: formData,
  });
  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as { uri?: string };
  if (!data.uri) return null;
  return { kind, uri: data.uri };
}

async function uploadArtifact(
  baseUrl: string,
  artifactPath: string,
  candidateId: string,
  stageRunId: string,
  kind: string,
): Promise<RunnerArtifact | null> {
  let buffer: Uint8Array;
  try {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- PP-1100 operator-provided artifact path
    buffer = await readFile(artifactPath);
  } catch {
    return null;
  }
  const blob = new Blob([buffer], { type: guessContentType(artifactPath) });
  return uploadArtifactBlob(
    baseUrl,
    blob,
    candidateId,
    stageRunId,
    kind,
    basename(artifactPath),
  );
}

async function uploadArtifactContent(
  baseUrl: string,
  content: string,
  candidateId: string,
  stageRunId: string,
  kind: string,
  filename: string,
): Promise<RunnerArtifact | null> {
  const blob = new Blob([content], { type: guessContentType(filename) });
  return uploadArtifactBlob(
    baseUrl,
    blob,
    candidateId,
    stageRunId,
    kind,
    filename,
  );
}

async function uploadArtifactBuffer(
  baseUrl: string,
  buffer: Buffer,
  candidateId: string,
  stageRunId: string,
  kind: string,
  filename: string,
): Promise<RunnerArtifact | null> {
  const blob = new Blob([buffer]);
  return uploadArtifactBlob(
    baseUrl,
    blob,
    candidateId,
    stageRunId,
    kind,
    filename,
  );
}

async function loadOutputOverrideFromFile(
  artifactPath: string | null,
): Promise<unknown | null> {
  if (!artifactPath) return null;
  const ext = extname(artifactPath).toLowerCase();
  if (ext !== ".json") return null;
  try {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- PP-1100 operator-provided artifact path
    const raw = await readFile(artifactPath, "utf8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function loadHtmlSnapshot(
  artifactPath: string | null,
): Promise<string | null> {
  if (!artifactPath) return null;
  const ext = extname(artifactPath).toLowerCase();
  if (ext !== ".html" && ext !== ".htm") return null;
  try {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- PP-1100 operator-provided artifact path
    return await readFile(artifactPath, "utf8");
  } catch {
    return null;
  }
}

function parseItems(value: unknown): StageMItem[] | null {
  if (!Array.isArray(value)) return null;
  const items: StageMItem[] = [];
  for (const entry of value) {
    if (!entry || typeof entry !== "object") continue;
    const record = entry as Record<string, unknown>;
    items.push({
      price:
        record.price ?? record.priceValue ?? record.price_amount,
      reviews:
        record.reviews ??
        record.reviewCount ??
        record.review_count ??
        record.ratingCount,
      sponsored:
        record.sponsored ?? record.isSponsored ?? record.is_sponsored,
    });
  }
  return items.length > 0 ? items : null;
}

function extractFirstPriceFromHtml(html: string): number | null {
  const regex = /a-offscreen[^>]*>([^<]+)</gi;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(html)) !== null) {
    const price = parseNumber(match[1]);
    if (price !== null && price > 0) return price;
  }
  return null;
}

function extractReviewCountFromText(text: string): number | null {
  const match = text.match(
    /([0-9.,]+)\s*(ratings|rating|reviews|review|bewertungen|rezensionen)/i,
  );
  if (!match) return null;
  return parseNumber(match[1]);
}

function isSponsoredBlock(text: string): boolean {
  return /sponsored|gesponsert/i.test(text);
}

function extractAmazonSearchItems(
  html: string,
  maxResults: number,
): StageMItem[] {
  const blocks = html.split('data-component-type="s-search-result"');
  const items: StageMItem[] = [];
  for (let i = 1; i < blocks.length; i += 1) {
    const block = blocks[i]?.slice(0, 15000) ?? "";
    const price = extractFirstPriceFromHtml(block);
    if (price === null) continue;
    const reviews = extractReviewCountFromText(block);
    items.push({
      price,
      reviews: reviews ?? undefined,
      sponsored: isSponsoredBlock(block),
    });
    if (items.length >= maxResults) break;
  }
  return items;
}

function extractPriceNearToken(
  html: string,
  tokens: string[],
  windowSize = 2000,
): number | null {
  for (const token of tokens) {
    const index = html.indexOf(token);
    if (index === -1) continue;
    const snippet = html.slice(index, index + windowSize);
    const price = extractFirstPriceFromHtml(snippet);
    if (price !== null) return price;
  }
  return null;
}

function extractAmazonListingItem(html: string): StageMItem[] | null {
  const price =
    extractPriceNearToken(html, [
      "priceblock_ourprice",
      "priceblock_dealprice",
      "priceblock_saleprice",
      "priceToPay",
      "corePriceDisplay_desktop_feature_div",
    ]) ?? extractFirstPriceFromHtml(html);
  if (price === null) return null;
  const reviewTextMatch = html.match(
    /id="acrCustomerReviewText"[^>]*>([^<]+)</i,
  );
  const reviewText = reviewTextMatch ? reviewTextMatch[1] : html;
  const reviews = extractReviewCountFromText(reviewText);
  return [
    {
      price,
      reviews: reviews ?? undefined,
    },
  ];
}

function extractTaobaoPrices(html: string): number[] {
  const patterns = [
    /"price"\s*:\s*"([^"]+)"/gi,
    /"price"\s*:\s*([0-9.]+)/gi,
    /"view_price"\s*:\s*"([^"]+)"/gi,
    /"priceText"\s*:\s*"([^"]+)"/gi,
    /"sku_price"\s*:\s*"([^"]+)"/gi,
  ];
  const values: number[] = [];
  for (const pattern of patterns) {
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(html)) !== null) {
      const price = parseNumber(match[1]);
      if (price !== null && price > 0) values.push(price);
    }
  }
  return uniqueNumbers(values);
}

function buildStageMOutputFromHtml(
  job: RunnerJob,
  html: string,
  sourceUrl?: string,
): StageMOutput | null {
  const maxResults = job.input.maxResults ?? 20;
  if (job.input.kind === "amazon_search") {
    const items = extractAmazonSearchItems(html, maxResults);
    return items.length > 0
      ? buildStageMOutputFromItems(job, items, sourceUrl)
      : null;
  }
  if (job.input.kind === "amazon_listing") {
    const items = extractAmazonListingItem(html);
    return items ? buildStageMOutputFromItems(job, items, sourceUrl) : null;
  }
  const taobaoPrices = extractTaobaoPrices(html);
  if (taobaoPrices.length === 0) return null;
  const items: StageMItem[] = taobaoPrices
    .slice(0, maxResults)
    .map((price) => ({ price }));
  return buildStageMOutputFromItems(job, items, sourceUrl);
}

function normalizeStageMOutput(job: RunnerJob, output: StageMOutput): StageMOutput {
  return {
    kind: output.kind ?? job.input.kind,
    marketplace: output.marketplace ?? job.input.marketplace ?? null,
    query: output.query ?? job.input.query ?? null,
    url: output.url ?? job.input.url ?? null,
    maxResults: output.maxResults ?? job.input.maxResults ?? null,
    priceSample: output.priceSample,
    priceMin: output.priceMin ?? null,
    priceMax: output.priceMax ?? null,
    priceMedian: output.priceMedian ?? null,
    reviewMedian: output.reviewMedian ?? null,
    sponsoredShare: output.sponsoredShare ?? null,
    generatedAt: output.generatedAt ?? new Date().toISOString(),
  };
}

function buildStageMOutputFromItems(
  job: RunnerJob,
  items: StageMItem[],
  sourceUrl?: string,
): StageMOutput {
  const prices = items
    .map((item) => parseNumber(item.price))
    .filter((value): value is number => value !== null);
  const reviews = items
    .map((item) => parseNumber(item.reviews))
    .filter((value): value is number => value !== null);
  const sponsoredFlags = items
    .map((item) => parseBoolean(item.sponsored))
    .filter((value): value is boolean => value !== null);
  const sponsoredCount = sponsoredFlags.filter((value) => value).length;

  const priceMin = prices.length > 0 ? Math.min(...prices) : null;
  const priceMax = prices.length > 0 ? Math.max(...prices) : null;
  const priceMedian = computeMedian(prices);
  const reviewMedian = computeMedian(reviews);
  const sponsoredShare =
    sponsoredFlags.length > 0
      ? Number((sponsoredCount / sponsoredFlags.length).toFixed(2))
      : null;

  return normalizeStageMOutput(job, {
    url: sourceUrl ?? job.input.url ?? null,
    priceSample: prices,
    priceMin,
    priceMax,
    priceMedian,
    reviewMedian,
    sponsoredShare,
    generatedAt: new Date().toISOString(),
  });
}

function selectOverrideForJob(
  override: unknown,
  job: RunnerJob,
): unknown | null {
  if (!override) return null;
  if (Array.isArray(override)) {
    const match = override.find((entry) => {
      if (!entry || typeof entry !== "object") return false;
      const record = entry as OutputOverrideRecord;
      return record.jobId === job.id || record.candidateId === job.candidateId;
    });
    if (match) return match;
    return override.length === 1 ? override[0] : null;
  }
  if (typeof override === "object") {
    const record = override as Record<string, unknown>;
    const outputs = record.outputs;
    if (outputs && typeof outputs === "object") {
      const mapped = outputs as Record<string, unknown>;
      return mapped[job.id] ?? mapped[job.candidateId ?? ""] ?? null;
    }
    return override;
  }
  return null;
}

function resolveOverrideOutput(
  job: RunnerJob,
  override: unknown,
): StageMOutput | null {
  if (!override) return null;
  if (Array.isArray(override)) {
    const items = parseItems(override);
    if (items) return buildStageMOutputFromItems(job, items);
    return null;
  }
  if (typeof override !== "object") return null;
  const record = override as Record<string, unknown>;
  if (record.output) {
    return resolveOverrideOutput(job, record.output);
  }
  if (record.items) {
    return resolveOverrideOutput(job, record.items);
  }
  if ("priceMin" in record || "priceSample" in record || "priceMedian" in record) {
    return normalizeStageMOutput(job, record as StageMOutput);
  }
  return null;
}

function buildSyntheticStageMOutput(job: RunnerJob): StageMOutput {
  const seed =
    hashString(job.candidateId) +
    hashString(job.input.query ?? job.input.url ?? "market");
  const basePrice = 8 + (seed % 20);
  const priceStep = 0.8 + (seed % 5) * 0.3;
  const prices = Array.from({ length: 6 }, (_, index) =>
    Number((basePrice + index * priceStep).toFixed(2)),
  );

  const priceMin = Math.min(...prices);
  const priceMax = Math.max(...prices);
  const priceMedian = prices[Math.floor(prices.length / 2)];
  const reviewMedian = 120 + (seed % 650);
  const sponsoredShare = Number((((seed % 30) + 10) / 100).toFixed(2));

  return {
    kind: job.input.kind,
    marketplace: job.input.marketplace ?? null,
    query: job.input.query ?? null,
    url: job.input.url ?? null,
    maxResults: job.input.maxResults ?? null,
    priceSample: prices,
    priceMin,
    priceMax,
    priceMedian,
    reviewMedian,
    sponsoredShare,
    generatedAt: new Date().toISOString(),
  };
}

function buildStageMOutput(job: RunnerJob, override?: unknown): StageMOutput {
  const selected = selectOverrideForJob(override, job);
  const resolved = resolveOverrideOutput(job, selected);
  return resolved ?? buildSyntheticStageMOutput(job);
}

function resolveCaptureUrl(job: RunnerJob): string | null {
  if (job.input.kind === "amazon_search") {
    if (!job.input.marketplace || !job.input.query) return null;
    return buildAmazonSearchUrl(job.input.marketplace, job.input.query);
  }
  if (!job.input.url) return null;
  return normalizeUrl(job.input.url);
}

async function clickCookieSelectors(
  page: { locator: (selector: string) => { count: () => Promise<number>; first: () => { click: (options?: { timeout?: number }) => Promise<void> } } },
  selectors: string[] | null,
): Promise<string[]> {
  if (!selectors || selectors.length === 0) return [];
  for (const selector of selectors) {
    try {
      const locator = page.locator(selector);
      const count = await locator.count();
      if (count === 0) continue;
      await locator.first().click({ timeout: 1500 });
      return [selector];
    } catch {
      continue;
    }
  }
  return [];
}

async function loadPlaywrightChromium() {
  try {
    const playwright = (await import("playwright")) as typeof import("playwright");
    return playwright.chromium;
  } catch (error) {
    const err = error as Error & { code?: string };
    const code = err?.code;
    if (code === "ERR_MODULE_NOT_FOUND" || code === "MODULE_NOT_FOUND") {
      throw new Error("playwright_missing");
    }
    throw error;
  }
}

async function captureWithPlaywright(
  targetUrl: string,
  capture: CaptureConfig,
): Promise<{
  html: string;
  sourceUrl: string;
  screenshot?: Buffer | null;
  cookieSelectorsUsed?: string[];
}> {
  const chromium = await loadPlaywrightChromium();
  const context = capture.userDataDir
    ? await chromium.launchPersistentContext(capture.userDataDir, {
        headless: capture.headless,
        userAgent: capture.userAgent ?? undefined,
        locale: capture.acceptLanguage ?? undefined,
      })
    : await chromium.launch({
        headless: capture.headless,
      }).then((browser) =>
        browser.newContext({
          userAgent: capture.userAgent ?? undefined,
          locale: capture.acceptLanguage ?? undefined,
        }),
      );
  const browser = context.browser();
  const page = await context.newPage();
  let timedOut = false;
  const timeout = setTimeout(() => {
    timedOut = true;
    page.close().catch(() => {});
  }, capture.timeoutMs);

  try {
    await page.goto(targetUrl, {
      waitUntil: "domcontentloaded",
      timeout: capture.timeoutMs,
    });
    const cookieSelectorsUsed = await clickCookieSelectors(
      page,
      capture.cookieSelectors,
    );
    if (capture.waitForSelector) {
      await page.waitForSelector(capture.waitForSelector, {
        timeout: capture.timeoutMs,
      }).catch(() => null);
    }
    if (capture.postNavWaitMs > 0) {
      await page.waitForTimeout(capture.postNavWaitMs);
    }
    if (capture.scrollSteps > 0) {
      for (let i = 0; i < capture.scrollSteps; i += 1) {
        await page.evaluate(() => {
          window.scrollBy(0, window.innerHeight * 0.9);
        });
        await page.waitForTimeout(250);
      }
    }
    if (capture.humanGate) {
      const allowed = await promptHumanGate(
        capture.humanGateMessage ?? DEFAULT_HUMAN_GATE_MESSAGE,
      );
      if (!allowed) {
        throw new Error("human_gate_declined");
      }
    }
    const html = await page.content();
    const screenshot =
      capture.screenshot && !timedOut
        ? await page.screenshot({ fullPage: true })
        : null;
    const sourceUrl = page.url() || targetUrl;
    return {
      html,
      sourceUrl,
      screenshot: screenshot ? Buffer.from(screenshot) : null,
      cookieSelectorsUsed,
    };
  } finally {
    clearTimeout(timeout);
    await browser.close();
  }
}

async function fetchHtmlSnapshot(
  targetUrl: string,
  capture: CaptureConfig,
): Promise<{ html: string; sourceUrl: string }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), capture.timeoutMs);
  const headers: Record<string, string> = {
    Accept: "text/html,application/xhtml+xml",
  };
  if (capture.userAgent) {
    headers["User-Agent"] = capture.userAgent;
  }
  if (capture.acceptLanguage) {
    headers["Accept-Language"] = capture.acceptLanguage;
  }
  try {
    const response = await fetch(targetUrl, {
      headers,
      redirect: "follow",
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(`capture_failed (${response.status})`);
    }
    const html = await response.text();
    if (!html.trim()) {
      throw new Error("capture_empty");
    }
    return { html, sourceUrl: response.url || targetUrl };
  } finally {
    clearTimeout(timeout);
  }
}

function buildCaptureMeta(
  capture: CaptureConfig,
  targetUrl: string | null,
): CaptureMeta {
  return {
    mode: capture.mode,
    headless: capture.headless,
    humanGate: capture.humanGate,
    playbook: capture.playbookId,
    waitSelector: capture.waitForSelector,
    scrollSteps: capture.scrollSteps,
    postNavWaitMs: capture.postNavWaitMs,
    sessionProfile: capture.sessionProfile,
    userDataDir: capture.userDataDir ? basename(capture.userDataDir) : null,
    captureUrl: targetUrl,
    sourceUrl: null,
    durationMs: null,
    cookieSelectorsUsed: null,
  };
}

function attachCaptureMeta(
  output: StageMOutput,
  meta: CaptureMeta | null,
): StageMOutput {
  if (!meta) return output;
  return { ...output, captureMeta: meta };
}

async function sendRunnerPing(
  baseUrl: string,
  payload: RunnerPingRequest,
): Promise<void> {
  try {
    const response = await fetch(`${baseUrl}/api/runner/ping`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      throw new Error(`ping failed (${response.status})`);
    }
  } catch (error) {
    console.warn("Runner heartbeat failed.", error);
  }
}

async function claimJobs(
  baseUrl: string,
  runnerId: string,
  limit: number,
  captureMode?: "queue" | "runner",
): Promise<RunnerJob[]> {
  const response = await fetch(`${baseUrl}/api/runner/claim`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      runnerId,
      stage: "M",
      limit,
      ...(captureMode ? { captureMode } : {}),
    }),
  });

  if (!response.ok) {
    throw new Error(`claim failed (${response.status})`);
  }

  const data = (await response.json()) as RunnerClaimResponse & { ok?: boolean };
  return data.jobs ?? [];
}

async function completeJob(
  baseUrl: string,
  payload: RunnerCompleteRequest,
): Promise<void> {
  const response = await fetch(`${baseUrl}/api/runner/complete`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error(`complete failed (${response.status})`);
  }
}

async function processJob(
  baseUrl: string,
  job: RunnerJob,
  artifactPath: string | null,
  htmlArtifactKind: string,
  screenshotArtifactKind: string,
  outputOverride: unknown | null,
  capture: CaptureConfig,
): Promise<void> {
  const artifacts: RunnerArtifact[] = [];
  if (artifactPath) {
    const artifact = await uploadArtifact(
      baseUrl,
      artifactPath,
      job.candidateId,
      job.id,
      htmlArtifactKind,
    );
    if (artifact) {
      artifacts.push(artifact);
    }
  }

  const fileOverride =
    outputOverride ?? (await loadOutputOverrideFromFile(artifactPath));
  const htmlSnapshot =
    fileOverride === null ? await loadHtmlSnapshot(artifactPath) : null;
  let output: StageMOutput | null =
    fileOverride !== null ? buildStageMOutput(job, fileOverride) : null;
  let failure: RunnerError | null = null;
  let captureMeta: CaptureMeta | null = null;

  if (!output && htmlSnapshot) {
    output = buildStageMOutputFromHtml(job, htmlSnapshot);
    if (!output) {
      failure = {
        message: "No parseable data found in HTML snapshot.",
        code: "parse_failed",
      };
    }
  }

  if (!output && capture.enabled) {
    const targetUrl = resolveCaptureUrl(job);
    captureMeta = buildCaptureMeta(capture, targetUrl);
    if (!targetUrl) {
      failure = {
        message: "Missing capture URL for job input.",
        code: "capture_url_missing",
        ...(captureMeta ? { details: { captureMeta } } : {}),
      };
    } else {
      const isPlaywright = capture.mode === "playwright";
      const captureStart = Date.now();
      try {
        if (isPlaywright) {
          const { html, sourceUrl, screenshot, cookieSelectorsUsed } =
            await captureWithPlaywright(
            targetUrl,
            capture,
          );
          captureMeta.sourceUrl = sourceUrl;
          captureMeta.durationMs = Date.now() - captureStart;
          captureMeta.cookieSelectorsUsed = cookieSelectorsUsed ?? null;
          if (capture.humanGate) {
            captureMeta.humanGateOutcome = "accepted";
          }
          if (capture.upload) {
            const htmlArtifact = await uploadArtifactContent(
              baseUrl,
              html,
              job.candidateId,
              job.id,
              htmlArtifactKind,
              `capture-${job.id}.html`,
            );
            if (htmlArtifact) artifacts.push(htmlArtifact);
            if (screenshot) {
              const screenshotArtifact = await uploadArtifactBuffer(
                baseUrl,
                screenshot,
                job.candidateId,
                job.id,
                screenshotArtifactKind,
                `capture-${job.id}.png`,
              );
              if (screenshotArtifact) artifacts.push(screenshotArtifact);
            }
          }
          output = buildStageMOutputFromHtml(job, html, sourceUrl);
          if (!output) {
            failure = {
              message: "No parseable data found in Playwright capture.",
              code: "parse_failed",
              details: {
                url: sourceUrl,
                ...(captureMeta ? { captureMeta } : {}),
              },
            };
          }
        } else {
          const { html, sourceUrl } = await fetchHtmlSnapshot(targetUrl, capture);
          captureMeta.sourceUrl = sourceUrl;
          captureMeta.durationMs = Date.now() - captureStart;
          if (capture.upload) {
            const filename = `capture-${job.id}.html`;
            const artifact = await uploadArtifactContent(
              baseUrl,
              html,
              job.candidateId,
              job.id,
              htmlArtifactKind,
              filename,
            );
            if (artifact) {
              artifacts.push(artifact);
            }
          }
          output = buildStageMOutputFromHtml(job, html, sourceUrl);
          if (!output) {
            failure = {
              message: "No parseable data found in captured HTML.",
              code: "parse_failed",
              details: {
                url: sourceUrl,
                ...(captureMeta ? { captureMeta } : {}),
              },
            };
          }
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Capture failed.";
        const isAbort =
          error instanceof Error && error.name === "AbortError";
        const isMissingPlaywright =
          error instanceof Error && error.message === "playwright_missing";
        const isHumanGateDeclined =
          error instanceof Error && error.message === "human_gate_declined";
        if (captureMeta) {
          captureMeta.durationMs = Date.now() - captureStart;
          if (isHumanGateDeclined) {
            captureMeta.humanGateOutcome = "declined";
          }
        }
        failure = {
          message: isMissingPlaywright
            ? "Install playwright to run headful captures (pnpm dlx playwright install chromium)."
            : isHumanGateDeclined
              ? "Human gate declined; capture skipped."
            : isAbort
              ? `Capture timed out after ${capture.timeoutMs}ms.`
              : message,
          code: isMissingPlaywright
            ? "playwright_missing"
            : isHumanGateDeclined
              ? "human_gate_declined"
              : isAbort
                ? "capture_timeout"
                : "capture_failed",
          details: {
            url: targetUrl,
            ...(captureMeta ? { captureMeta } : {}),
          },
        };
      }
    }
  }

  if (!output) {
    await completeJob(baseUrl, {
      jobId: job.id,
      status: "failed",
      error:
        failure ??
        ({
          message: "No output available for job.",
          code: "no_output",
        } satisfies RunnerError),
      ...(artifacts.length ? { artifacts } : {}),
    });
    return;
  }

  if (captureMeta) {
    output = attachCaptureMeta(output, captureMeta);
  }

  await completeJob(baseUrl, {
    jobId: job.id,
    status: "succeeded",
    output,
    ...(artifacts.length ? { artifacts } : {}),
  });
}

async function run(): Promise<void> {
  const baseUrl = normalizeBaseUrl(
    getArgValue("--base-url") ??
      process.env["PIPELINE_BASE_URL"] ??
      "http://localhost:3012",
  );
  const runnerId =
    getArgValue("--runner-id") ??
    process.env["PIPELINE_RUNNER_ID"] ??
    "local-runner";
  const limit = Number.parseInt(getArgValue("--limit") ?? "2", 10);
  const watch = args.has("--watch");
  const intervalMs = Number.parseInt(getArgValue("--interval") ?? "8000", 10);
  const artifactPathArg = getArgValue("--artifact");
  const artifactKind = getArgValue("--artifact-kind") ?? "snapshot_html";
  const screenshotKind = getArgValue("--screenshot-kind") ?? "snapshot_png";
  const artifactPath = artifactPathArg ? resolve(artifactPathArg) : null;
  const outputFileArg = getArgValue("--output-file");
  const outputFilePath = outputFileArg ? resolve(outputFileArg) : null;
  const captureEnabled = args.has("--capture");
  const captureUpload = !args.has("--no-capture-upload");
  const captureModeRaw =
    getArgValue("--capture-mode") ??
    process.env["PIPELINE_RUNNER_CAPTURE_MODE"] ??
    (args.has("--playwright") ? "playwright" : "fetch");
  const captureMode: CaptureMode =
    captureModeRaw === "playwright" ? "playwright" : "fetch";
  const captureTimeoutRaw =
    getArgValue("--capture-timeout") ??
    process.env["PIPELINE_RUNNER_CAPTURE_TIMEOUT_MS"] ??
    `${DEFAULT_CAPTURE_TIMEOUT_MS}`;
  const captureTimeoutParsed = Number.parseInt(captureTimeoutRaw, 10);
  const captureTimeoutMs = Number.isFinite(captureTimeoutParsed)
    ? captureTimeoutParsed
    : DEFAULT_CAPTURE_TIMEOUT_MS;
  const captureUserAgent =
    getArgValue("--user-agent") ??
    process.env["PIPELINE_RUNNER_USER_AGENT"] ??
    DEFAULT_USER_AGENT;
  const captureAcceptLanguage =
    getArgValue("--accept-language") ??
    process.env["PIPELINE_RUNNER_ACCEPT_LANGUAGE"] ??
    DEFAULT_ACCEPT_LANGUAGE;
  const captureWaitForSelector =
    getArgValue("--wait-selector") ??
    process.env["PIPELINE_RUNNER_WAIT_SELECTOR"] ??
    null;
  const waitSelectorExplicit =
    getArgValue("--wait-selector") !== undefined ||
    process.env["PIPELINE_RUNNER_WAIT_SELECTOR"] !== undefined;
  const humanGateExplicit =
    args.has("--human") || process.env["PIPELINE_RUNNER_HUMAN_GATE"] === "1";
  const captureHumanGate =
    captureMode === "playwright" ? humanGateExplicit : false;
  const captureHeadless =
    args.has("--headful") || process.env["PIPELINE_RUNNER_HEADFUL"] === "1"
      ? false
      : true;
  const captureScreenshot =
    args.has("--no-screenshot") ||
    process.env["PIPELINE_RUNNER_SCREENSHOT"] === "0"
      ? false
      : true;
  const capturePostNavWaitMs =
    Number.parseInt(
      getArgValue("--post-nav-wait-ms") ??
        process.env["PIPELINE_RUNNER_POST_NAV_WAIT_MS"] ??
        "0",
      10,
    ) || 0;
  const postNavWaitExplicit =
    getArgValue("--post-nav-wait-ms") !== undefined ||
    process.env["PIPELINE_RUNNER_POST_NAV_WAIT_MS"] !== undefined;
  const captureScrollSteps =
    Number.parseInt(
      getArgValue("--scroll-steps") ??
        process.env["PIPELINE_RUNNER_SCROLL_STEPS"] ??
        "0",
      10,
    ) || 0;
  const scrollStepsExplicit =
    getArgValue("--scroll-steps") !== undefined ||
    process.env["PIPELINE_RUNNER_SCROLL_STEPS"] !== undefined;
  const captureUserDataDirRaw =
    getArgValue("--user-data-dir") ??
    process.env["PIPELINE_RUNNER_USER_DATA_DIR"] ??
    null;
  const captureUserDataDir = captureUserDataDirRaw
    ? resolve(captureUserDataDirRaw)
    : null;
  const playbookOverride =
    getArgValue("--playbook") ?? process.env["PIPELINE_RUNNER_PLAYBOOK"] ?? "auto";
  const playbookEnabled =
    !args.has("--no-playbook") && playbookOverride !== "none";
  const sessionRootRaw =
    getArgValue("--session-root") ??
    process.env["PIPELINE_RUNNER_SESSION_ROOT"] ??
    null;
  const sessionRotateRaw =
    getArgValue("--session-rotate") ??
    process.env["PIPELINE_RUNNER_SESSION_ROTATE"] ??
    null;
  const sessionProfile =
    getArgValue("--session-profile") ??
    process.env["PIPELINE_RUNNER_SESSION_PROFILE"] ??
    null;
  const sessionConfig: SessionConfig = {
    rootDir: sessionRootRaw ? resolve(sessionRootRaw) : null,
    rotation: resolveSessionRotation(sessionRotateRaw),
    profile: sessionProfile,
  };
  const claimModeRaw =
    getArgValue("--claim-mode") ??
    process.env["PIPELINE_RUNNER_CLAIM_MODE"] ??
    (captureMode === "playwright" ? "runner" : null);
  const claimMode =
    claimModeRaw === "queue" || claimModeRaw === "runner" ? claimModeRaw : undefined;
  const captureOverrides = {
    waitSelector: waitSelectorExplicit,
    postNavWaitMs: postNavWaitExplicit,
    scrollSteps: scrollStepsExplicit,
    humanGate: humanGateExplicit,
  };
  const captureConfig: CaptureConfig = {
    enabled: captureEnabled,
    upload: captureUpload,
    mode: captureMode,
    timeoutMs: captureTimeoutMs,
    userAgent: captureUserAgent,
    acceptLanguage: captureAcceptLanguage,
    waitForSelector: captureWaitForSelector,
    humanGate: captureHumanGate,
    humanGateMessage: null,
    headless: captureHeadless,
    screenshot: captureScreenshot,
    postNavWaitMs: Number.isFinite(capturePostNavWaitMs)
      ? capturePostNavWaitMs
      : 0,
    scrollSteps: Number.isFinite(captureScrollSteps)
      ? Math.max(0, captureScrollSteps)
      : 0,
    userDataDir: await ensureDir(captureUserDataDir),
    sessionProfile: sessionProfile,
    playbookId: null,
    cookieSelectors: null,
  };
  let outputOverride: unknown | null = null;
  if (outputFilePath) {
    try {
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- PP-1100 operator-provided output path
      const raw = await readFile(outputFilePath, "utf8");
      outputOverride = JSON.parse(raw);
    } catch (error) {
      console.warn("Failed to parse output file.", error);
    }
  }

  const runOnce = async () => {
    await sendRunnerPing(baseUrl, {
      runnerId,
      mode: captureConfig.mode,
      headless: captureConfig.headless,
      humanGate: captureConfig.humanGate,
      sessionProfile: sessionConfig.profile ?? undefined,
      playbook: playbookEnabled ? playbookOverride : "none",
      sessionRotation: sessionConfig.rotation,
      claimMode,
      captureEnabled: captureConfig.enabled,
    });
    const jobs = await claimJobs(baseUrl, runnerId, limit, claimMode);
    if (jobs.length === 0) {
      console.log("No jobs available.");
      return;
    }
    for (const job of jobs) {
      console.log(`Processing job ${job.id} (${job.input.kind})`);
      const captureForJob = await resolveCaptureConfigForJob(
        job,
        captureConfig,
        playbookOverride,
        playbookEnabled,
        sessionConfig,
        captureOverrides,
      );
      await processJob(
        baseUrl,
        job,
        artifactPath,
        artifactKind,
        screenshotKind,
        outputOverride,
        captureForJob,
      );
      console.log(`Completed job ${job.id}`);
    }
  };

  if (!watch) {
    await runOnce();
    return;
  }

  console.log("Runner watching for jobs.");
  while (true) {
    await runOnce();
    await new Promise((resolvePromise) => setTimeout(resolvePromise, intervalMs));
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
