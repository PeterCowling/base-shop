/* i18n-exempt file -- PP-1100 Stage M HTML parsing [ttl=2026-06-30] */

import type { StageMItem, StageMJobInput, StageMOutput } from "./types";

const DEFAULT_MAX_RESULTS = 20;
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

function computeMedian(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
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
  let domain = trimmed.replace(/^https?:\/\//, "").replace(/^www\./, "");
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

function extractAmazonSearchItems(html: string, maxResults: number): StageMItem[] {
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
  const reviewTextMatch = html.match(/id="acrCustomerReviewText"[^>]*>([^<]+)</i);
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

function normalizeStageMOutput(
  input: StageMJobInput,
  output: StageMOutput,
  sourceUrl?: string,
): StageMOutput {
  return {
    kind: output.kind ?? input.kind,
    marketplace: output.marketplace ?? input.marketplace ?? null,
    query: output.query ?? input.query ?? null,
    url: output.url ?? sourceUrl ?? input.url ?? null,
    maxResults: output.maxResults ?? input.maxResults ?? null,
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
  input: StageMJobInput,
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

  return normalizeStageMOutput(
    input,
    {
      priceSample: prices,
      priceMin,
      priceMax,
      priceMedian,
      reviewMedian,
      sponsoredShare,
      generatedAt: new Date().toISOString(),
    },
    sourceUrl,
  );
}

export function buildStageMOutputFromHtml(
  input: StageMJobInput,
  html: string,
  sourceUrl?: string,
): StageMOutput | null {
  const maxResults = input.maxResults ?? DEFAULT_MAX_RESULTS;
  if (input.kind === "amazon_search") {
    const items = extractAmazonSearchItems(html, maxResults);
    return items.length > 0
      ? buildStageMOutputFromItems(input, items, sourceUrl)
      : null;
  }
  if (input.kind === "amazon_listing") {
    const items = extractAmazonListingItem(html);
    return items ? buildStageMOutputFromItems(input, items, sourceUrl) : null;
  }
  const taobaoPrices = extractTaobaoPrices(html);
  if (taobaoPrices.length === 0) return null;
  const items: StageMItem[] = taobaoPrices
    .slice(0, maxResults)
    .map((price) => ({ price }));
  return buildStageMOutputFromItems(input, items, sourceUrl);
}

export function resolveCaptureUrl(input: StageMJobInput): string | null {
  if (input.kind === "amazon_search") {
    if (!input.marketplace || !input.query) return null;
    return buildAmazonSearchUrl(input.marketplace, input.query);
  }
  if (!input.url) return null;
  return normalizeUrl(input.url);
}
