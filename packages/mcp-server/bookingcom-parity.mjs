#!/usr/bin/env node

/**
 * Booking.com parity capture for BRIK.
 *
 * Writes/appends a single row into the dated parity scenarios CSV:
 *   <output-dir>/<as-of>-parity-scenarios.csv
 *
 * Auto-only mode: attempts automated extraction with extra-slow navigation
 * to avoid bot detection. On failure, writes a deterministic row with
 * total_price_all_in=unavailable and diagnostic notes including failure_reason.
 *
 * Bot detection is a known risk. This script uses:
 * - Very slow navigation (slowMoMs=1000)
 * - Real Chrome executable
 * - Realistic delays between actions
 * - Conservative selectors
 */

import { promises as fs } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  buildBookingcomParityCsvRow,
  buildBookingcomUrl,
  PARITY_SCENARIOS_HEADER,
  parseNumberLike,
  requireIsoDate,
  requireOneOf,
  round2,
} from "./dist/startup-loop/parity-bookingcom.js";
import { handleToolCall } from "./dist/tools/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DEFAULT_OUTPUT_DIR = join(__dirname, "../../docs/business-os/market-research/BRIK/data");

const BRIK_BOOKINGCOM_PROPERTY_ID = "hostel-brikette";

function isoNowUtc() {
  return new Date().toISOString();
}

function parseArgs(argv) {
  const args = Array.isArray(argv) ? argv.slice() : [];

  const parsed = {
    asOf: null,
    outputDir: DEFAULT_OUTPUT_DIR,
    scenario: null,
    checkIn: null,
    checkOut: null,
    pax: 1,
    currency: "EUR",
  };

  const positionals = [];

  for (let i = 0; i < args.length; i += 1) {
    const token = args[i];

    if (token === "--as-of") {
      parsed.asOf = args[i + 1];
      i += 1;
      continue;
    }

    if (token === "--output-dir") {
      parsed.outputDir = args[i + 1];
      i += 1;
      continue;
    }

    if (token === "--scenario") {
      parsed.scenario = args[i + 1];
      i += 1;
      continue;
    }

    if (token === "--check-in") {
      parsed.checkIn = args[i + 1];
      i += 1;
      continue;
    }

    if (token === "--check-out") {
      parsed.checkOut = args[i + 1];
      i += 1;
      continue;
    }

    if (token === "--pax") {
      parsed.pax = Number.parseInt(args[i + 1] ?? "", 10);
      i += 1;
      continue;
    }

    if (token === "--currency") {
      parsed.currency = args[i + 1];
      i += 1;
      continue;
    }

    if (token.startsWith("--")) {
      throw new Error(`unknown_arg:${token}`);
    }

    positionals.push(token);
  }

  if (positionals.length > 0) {
    throw new Error(`unexpected_positional_args:${positionals.join(",")}`);
  }

  if (!parsed.asOf) {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    parsed.asOf = `${year}-${month}-${day}`;
  }

  requireOneOf(parsed.scenario, ["S1", "S2", "S3"], "scenario");
  requireIsoDate(parsed.asOf, "as_of");
  requireIsoDate(parsed.checkIn, "check_in");
  requireIsoDate(parsed.checkOut, "check_out");

  if (!Number.isInteger(parsed.pax) || parsed.pax <= 0) {
    throw new Error(`invalid_pax:${String(parsed.pax)}`);
  }

  if (typeof parsed.currency !== "string" || parsed.currency.trim().length !== 3) {
    throw new Error(`invalid_currency:${String(parsed.currency)}`);
  }

  return parsed;
}

function parseToolJson(toolResult) {
  const first = toolResult?.content?.[0]?.text;
  if (typeof first !== "string" || !first.trim()) {
    throw new Error("Unexpected tool response shape (missing content[0].text)");
  }
  return JSON.parse(first);
}

async function tool(name, args) {
  const result = await handleToolCall(name, args);
  return parseToolJson(result);
}

async function openSession(url) {
  const open = await tool("browser_session_open", {
    url,
    headless: false,
    slowMoMs: 1000, // Extra slow to avoid bot detection
    executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  });

  const sessionId = open.sessionId;
  if (typeof sessionId !== "string" || !sessionId) {
    throw new Error("browser_session_open did not return a sessionId");
  }

  return sessionId;
}

async function observe(sessionId, scope) {
  return await tool("browser_observe", {
    sessionId,
    mode: "a11y",
    scope,
    maxAffordances: 200,
  });
}

async function sleep(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function ensureFileHeader(filePath, headerLine) {
  try {
    const existing = await fs.readFile(filePath, "utf-8");
    if (existing.trim().length === 0) {
      await fs.writeFile(filePath, headerLine + "\n", "utf-8");
      return;
    }

    const firstLine = existing.split("\n")[0]?.trim();
    if (firstLine !== headerLine) {
      throw new Error(`csv_header_mismatch:${filePath}`);
    }
  } catch (err) {
    if (err && typeof err === "object" && "code" in err && err.code === "ENOENT") {
      await fs.mkdir(dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, headerLine + "\n", "utf-8");
      return;
    }

    throw err;
  }
}

async function appendRowAtomic(filePath, rowLine) {
  const tmpPath = `${filePath}.tmp`;

  const existing = await fs.readFile(filePath, "utf-8");
  const next = existing.endsWith("\n") ? existing + rowLine + "\n" : existing + "\n" + rowLine + "\n";

  await fs.writeFile(tmpPath, next, "utf-8");
  await fs.rename(tmpPath, filePath);
}

async function main() {
  const parsed = parseArgs(process.argv.slice(2));

  const parityPath = join(parsed.outputDir, `${parsed.asOf}-parity-scenarios.csv`);

  const url = buildBookingcomUrl({
    propertyId: BRIK_BOOKINGCOM_PROPERTY_ID,
    checkIn: parsed.checkIn,
    checkOut: parsed.checkOut,
    travellers: parsed.pax,
  });

  console.info("Booking.com parity capture - auto-only mode");
  console.info(`Scenario: ${parsed.scenario}`);
  console.info(`Dates: ${parsed.checkIn} -> ${parsed.checkOut} (pax=${parsed.pax})`);
  console.info(`URL: ${url}`);
  console.info(`Output: ${parityPath}\n`);
  console.info("⚠️  Bot detection risk: using extra-slow navigation (slowMo=1000ms)\n");

  await ensureFileHeader(parityPath, PARITY_SCENARIOS_HEADER);

  let sessionId = null;
  let capture = null;
  let failureReason = null;

  try {
    sessionId = await openSession(url);
    console.info("Waiting 6 seconds for page to load...");
    await sleep(6000); // Extra long wait for bot detection avoidance

    const obs = await observe(sessionId, "document");
    const evidenceUrl = obs?.page?.url || url;

    // Check if we hit a CAPTCHA or bot detection page
    if (evidenceUrl.includes("captcha") || obs?.page?.title?.toLowerCase().includes("captcha")) {
      throw new Error("CAPTCHA page detected - bot detection triggered");
    }

    // Attempt auto-extraction from Booking.com
    try {
      const priceData = await tool("browser_act", {
        sessionId,
        target: { kind: "page" },
        action: {
          type: "evaluate",
          expression: `
            (() => {
              // Booking.com price selectors
              // Strategy 1: data-testid attributes
              const testIdSelectors = [
                '[data-testid="price-display"]',
                '[data-testid="price-and-discounted-price"]',
                '[data-testid="price-for-x-nights"]',
              ];

              for (const sel of testIdSelectors) {
                const elem = document.querySelector(sel);
                if (elem && elem.textContent) {
                  const text = elem.textContent.trim();
                  if (/\\d/.test(text)) {
                    return text;
                  }
                }
              }

              // Strategy 2: Common class patterns
              const classSelectors = [
                '.bui-price-display__value',
                '.prco-text-nowrap-helper',
                '[class*="prco-inline-block"]',
              ];

              for (const sel of classSelectors) {
                const elem = document.querySelector(sel);
                if (elem && elem.textContent) {
                  const text = elem.textContent.trim();
                  if (/\\d/.test(text)) {
                    return text;
                  }
                }
              }

              // Strategy 3: Fallback - scan body for EUR/€ with price
              const allText = document.body?.innerText || '';
              const eurMatch = allText.match(/€\\s*(\\d+[.,]?\\d*)/);
              if (eurMatch) return eurMatch[0];

              return null;
            })()
          `,
        },
      });

      const extractedText = priceData?.result;
      if (!extractedText || typeof extractedText !== "string") {
        throw new Error("Price element not found on page");
      }

      const totalPriceAllIn = round2(parseNumberLike(extractedText));

      capture = {
        totalPriceAllIn,
        currency: parsed.currency,
        taxesFeesClarity: "unknown", // Cannot reliably extract policy text in auto mode
        cancellationCutoff: "",
        evidenceUrl,
      };
    } catch (extractErr) {
      failureReason = extractErr instanceof Error ? extractErr.message : String(extractErr);
      throw extractErr;
    }
  } catch (err) {
    // On failure, write a deterministic unavailable row
    failureReason = failureReason || (err instanceof Error ? err.message : String(err));

    const rowLine = buildBookingcomParityCsvRow({
      scenario: parsed.scenario,
      checkIn: parsed.checkIn,
      checkOut: parsed.checkOut,
      travellers: parsed.pax,
      totalPriceAllIn: -1, // Sentinel for unavailable
      currency: parsed.currency,
      taxesFeesClarity: "unknown",
      cancellationCutoff: "",
      captureMode: "auto",
      capturedAtIso: isoNowUtc(),
      evidenceUrl: url,
      failureReason,
    });

    await appendRowAtomic(parityPath, rowLine);

    console.error(`Extraction failed: ${failureReason}`);
    console.info("Wrote unavailable row:");
    console.info(rowLine);
  } finally {
    if (sessionId) {
      await tool("browser_session_close", { sessionId }).catch(() => {});
    }
  }

  // Success path
  if (capture) {
    const rowLine = buildBookingcomParityCsvRow({
      scenario: parsed.scenario,
      checkIn: parsed.checkIn,
      checkOut: parsed.checkOut,
      travellers: parsed.pax,
      totalPriceAllIn: capture.totalPriceAllIn,
      currency: capture.currency,
      taxesFeesClarity: capture.taxesFeesClarity,
      cancellationCutoff: capture.cancellationCutoff,
      captureMode: "auto",
      capturedAtIso: isoNowUtc(),
      evidenceUrl: capture.evidenceUrl,
    });

    await appendRowAtomic(parityPath, rowLine);

    console.info("Wrote row:");
    console.info(rowLine);
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
