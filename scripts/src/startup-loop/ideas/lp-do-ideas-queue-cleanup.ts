/**
 * One-time cleanup script for ideas queue data quality.
 *
 * Operations:
 * 1. Identify and remove enqueued noise dispatches (using content guards from TASK-01)
 * 2. Classify missing domain fields on remaining dispatches
 * 3. Fix non-canonical domain values (BUILD→PRODUCTS, Platform→BOS)
 * 4. Annotate completed noise entries with noise_flagged: true
 * 5. Recalculate counts and write atomically
 *
 * Usage:
 *   npx tsx scripts/src/startup-loop/ideas/lp-do-ideas-queue-cleanup.ts [--dry-run] [--queue-path <path>]
 */

import { readFileSync } from "node:fs";

import { validateDispatchContent } from "./lp-do-ideas-queue-admission.js";
import {
  atomicWriteQueueState,
  buildCounts,
  type QueueDispatch,
  type QueueFileShape,
  readQueueStateFile,
} from "./lp-do-ideas-queue-state-file.js";

// ---------------------------------------------------------------------------
// Domain classification
// ---------------------------------------------------------------------------

const DOMAIN_CANONICAL: Record<string, string> = {
  BUILD: "PRODUCTS",
  Platform: "BOS",
  platform: "BOS",
  PLATFORM: "BOS",
};

/**
 * Infer domain from dispatch content when domain field is missing.
 * Uses business + area_anchor heuristics.
 */
function inferDomain(dispatch: QueueDispatch): string | null {
  const business = (dispatch.business ?? "").toUpperCase();
  const anchor = (dispatch.area_anchor ?? "").toLowerCase();

  // Business-level defaults
  if (business === "PLAT" || business === "BOS" || business === "REPO") return "BOS";

  // Content-based classification
  if (anchor.includes("pricing") || anchor.includes("price") || anchor.includes("revenue") ||
      anchor.includes("checkout") || anchor.includes("payment") || anchor.includes("booking")) return "SELL";
  if (anchor.includes("product") || anchor.includes("inventory") || anchor.includes("catalogue") ||
      anchor.includes("catalog") || anchor.includes("sku") || anchor.includes("stock")) return "PRODUCTS";
  if (anchor.includes("market") || anchor.includes("icp") || anchor.includes("competitor") ||
      anchor.includes("customer") || anchor.includes("audience") || anchor.includes("research")) return "MARKET";
  if (anchor.includes("channel") || anchor.includes("social") || anchor.includes("instagram") ||
      anchor.includes("etsy") || anchor.includes("distribution") || anchor.includes("outreach")) return "SELL";
  if (anchor.includes("brand") || anchor.includes("design") || anchor.includes("logo") ||
      anchor.includes("visual") || anchor.includes("style")) return "MARKET";
  if (anchor.includes("shipping") || anchor.includes("delivery") || anchor.includes("logistics") ||
      anchor.includes("supply") || anchor.includes("packaging") || anchor.includes("fulfil")) return "LOGISTICS";
  if (anchor.includes("legal") || anchor.includes("compliance") || anchor.includes("gdpr") ||
      anchor.includes("terms") || anchor.includes("privacy")) return "LEGAL";
  if (anchor.includes("assessment") || anchor.includes("profiling") || anchor.includes("naming")) return "ASSESSMENT";
  if (anchor.includes("strategy") || anchor.includes("plan") || anchor.includes("roadmap") ||
      anchor.includes("startup") || anchor.includes("loop")) return "STRATEGY";
  if (anchor.includes("ci") || anchor.includes("deploy") || anchor.includes("pipeline") ||
      anchor.includes("test") || anchor.includes("workflow") || anchor.includes("agent") ||
      anchor.includes("tool") || anchor.includes("skill") || anchor.includes("script")) return "BOS";
  if (anchor.includes("website") || anchor.includes("seo") || anchor.includes("page") ||
      anchor.includes("landing") || anchor.includes("navigation")) return "SELL";
  if (anchor.includes("email") || anchor.includes("inbox") || anchor.includes("reception") ||
      anchor.includes("guest") || anchor.includes("room") || anchor.includes("hostel")) return "SELL";

  // Business fallbacks
  if (business === "BRIK") return "SELL";
  if (business === "HBAG") return "SELL";
  if (business === "HEAD") return "SELL";

  return "STRATEGY"; // Conservative default
}

// ---------------------------------------------------------------------------
// Main cleanup
// ---------------------------------------------------------------------------

interface CleanupResult {
  noiseRemoved: number;
  noiseFlagged: number;
  domainsClassified: number;
  domainsFixed: number;
  totalBefore: number;
  totalAfter: number;
  domainDistribution: Record<string, number>;
  removedSample: string[];
  classifiedSample: Array<{ anchor: string; domain: string }>;
  fixedSample: Array<{ anchor: string; from: string; to: string }>;
}

export function cleanupQueue(
  queueStatePath: string,
  dryRun: boolean,
): CleanupResult {
  const readResult = readQueueStateFile(queueStatePath);
  if (!readResult.ok) {
    throw new Error(`Failed to read queue state: ${readResult.reason} ${readResult.error ?? ""}`);
  }

  const queue = readResult.queue;
  const totalBefore = queue.dispatches.length;

  // Build existing area_anchors set for dedup checking
  const seenAnchors = new Set<string>();
  const keptDispatches: QueueDispatch[] = [];
  let noiseRemoved = 0;
  let noiseFlagged = 0;
  let domainsClassified = 0;
  let domainsFixed = 0;
  const removedSample: string[] = [];
  const classifiedSample: Array<{ anchor: string; domain: string }> = [];
  const fixedSample: Array<{ anchor: string; from: string; to: string }> = [];

  for (const dispatch of queue.dispatches) {
    const anchor = typeof dispatch.area_anchor === "string" ? dispatch.area_anchor : "";
    const trigger = typeof dispatch.trigger === "string" ? dispatch.trigger : "artifact_delta";
    const queueState = typeof dispatch.queue_state === "string" ? dispatch.queue_state : "";

    // Fix non-canonical domains FIRST (before guard check)
    const domainRaw = dispatch.domain as string | undefined;
    if (domainRaw && DOMAIN_CANONICAL[domainRaw]) {
      const fixed = DOMAIN_CANONICAL[domainRaw];
      if (fixedSample.length < 5) {
        fixedSample.push({ anchor: anchor.slice(0, 60), from: domainRaw, to: fixed });
      }
      dispatch.domain = fixed;
      domainsFixed += 1;
    }

    // Classify missing domains
    if (!domainRaw || domainRaw === "") {
      const inferred = inferDomain(dispatch);
      if (inferred) {
        dispatch.domain = inferred;
        domainsClassified += 1;
        if (classifiedSample.length < 5) {
          classifiedSample.push({ anchor: anchor.slice(0, 60), domain: inferred });
        }
      }
    }

    // Check content guard (after domain fixup so domain_non_canonical doesn't reject fixed entries)
    const guardResult = validateDispatchContent(
      { area_anchor: anchor, trigger, domain: dispatch.domain as string | undefined },
      Array.from(seenAnchors),
    );

    if (!guardResult.accepted) {
      if (queueState === "enqueued") {
        // Remove enqueued noise
        noiseRemoved += 1;
        if (removedSample.length < 5) {
          removedSample.push(`[${guardResult.reason}] ${anchor.slice(0, 80)}`);
        }
        continue; // Skip — don't add to kept dispatches
      } else {
        // Flag completed/processed noise entries (don't remove)
        noiseFlagged += 1;
        dispatch.noise_flagged = true;
      }
    }

    // Add to seen anchors for dedup tracking
    if (anchor.length > 0) {
      seenAnchors.add(anchor.trim().toLowerCase());
    }

    keptDispatches.push(dispatch);
  }

  // Calculate domain distribution
  const domainDistribution: Record<string, number> = {};
  for (const d of keptDispatches) {
    const dom = (d.domain as string) || "UNKNOWN";
    domainDistribution[dom] = (domainDistribution[dom] || 0) + 1;
  }

  if (!dryRun) {
    const cleanedQueue: QueueFileShape = {
      ...queue,
      dispatches: keptDispatches,
      last_updated: new Date().toISOString(),
      counts: buildCounts(keptDispatches),
    };
    const writeResult = atomicWriteQueueState(queueStatePath, cleanedQueue);
    if (!writeResult.ok) {
      throw new Error(`Failed to write cleaned queue state: ${writeResult.error}`);
    }
  }

  return {
    noiseRemoved,
    noiseFlagged,
    domainsClassified,
    domainsFixed,
    totalBefore,
    totalAfter: keptDispatches.length,
    domainDistribution,
    removedSample,
    classifiedSample,
    fixedSample,
  };
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

if (process.argv[1]?.endsWith("lp-do-ideas-queue-cleanup.ts") ||
    process.argv[1]?.endsWith("lp-do-ideas-queue-cleanup.js")) {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const pathIdx = args.indexOf("--queue-path");
  const queuePath = pathIdx >= 0 && args[pathIdx + 1]
    ? args[pathIdx + 1]
    : "docs/business-os/startup-loop/ideas/trial/queue-state.json";

  console.log(`Queue cleanup: ${dryRun ? "DRY RUN" : "WRITE MODE"}`);
  console.log(`Queue path: ${queuePath}\n`);

  const result = cleanupQueue(queuePath, dryRun);

  console.log("=== Cleanup Summary ===");
  console.log(`Total dispatches before: ${result.totalBefore}`);
  console.log(`Total dispatches after:  ${result.totalAfter}`);
  console.log(`Noise removed (enqueued): ${result.noiseRemoved}`);
  console.log(`Noise flagged (completed/processed): ${result.noiseFlagged}`);
  console.log(`Domains classified: ${result.domainsClassified}`);
  console.log(`Domains fixed (non-canonical): ${result.domainsFixed}`);
  console.log();

  if (result.removedSample.length > 0) {
    console.log("--- Removed samples ---");
    for (const s of result.removedSample) console.log(`  ${s}`);
    console.log();
  }

  if (result.classifiedSample.length > 0) {
    console.log("--- Domain classification samples ---");
    for (const s of result.classifiedSample) console.log(`  ${s.domain}: ${s.anchor}`);
    console.log();
  }

  if (result.fixedSample.length > 0) {
    console.log("--- Domain fix samples ---");
    for (const s of result.fixedSample) console.log(`  ${s.from}→${s.to}: ${s.anchor}`);
    console.log();
  }

  console.log("--- Domain distribution ---");
  const sorted = Object.entries(result.domainDistribution).sort((a, b) => b[1] - a[1]);
  for (const [domain, count] of sorted) {
    console.log(`  ${domain}: ${count} (${((count / result.totalAfter) * 100).toFixed(1)}%)`);
  }

  if (dryRun) {
    console.log("\n(Dry run — no changes written)");
  } else {
    console.log("\nQueue state updated successfully.");
  }
}
