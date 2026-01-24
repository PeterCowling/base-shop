#!/usr/bin/env node
/*
  Token drift report

  Usage:
    pnpm tsx scripts/src/tokens/report-drift.ts
    pnpm tsx scripts/src/tokens/report-drift.ts --json
    pnpm tsx scripts/src/tokens/report-drift.ts --fail-on-drift --scope=generated
*/

import fs from "node:fs";
import path from "node:path";

import { tokens as baseTokens } from "../../../packages/themes/base/src/tokens";

type DriftReport = {
  source: {
    tokensTsPath: string;
    generatedTokensCssPath?: string;
  };
  counts: {
    tokensTsKeys: number;
    generatedCssVars?: number;
    generatedCssVarsNormalized?: number;
  };
  missingFromGeneratedCss?: string[];
  extrasInGeneratedCss?: string[];
};

const ROOT = process.cwd();
const TOKENS_TS_PATH = path.join(ROOT, "packages", "themes", "base", "src", "tokens.ts");
const GENERATED_CSS_PATH = path.join(ROOT, "packages", "themes", "base", "tokens.css");

function readCssVars(filePath: string): string[] {
  let css: string;
  try {
    css = fs.readFileSync(filePath, "utf8");
  } catch {
    return [];
  }
  const matches = Array.from(css.matchAll(/--([A-Za-z0-9_-]+)\s*:/g));
  const vars = matches.map((m) => `--${m[1]}`);
  return Array.from(new Set(vars));
}

function normalize(vars: string[]): string[] {
  const out = vars.map((v) => (v.endsWith("-dark") ? v.slice(0, -5) : v));
  return Array.from(new Set(out));
}

function diff(a: string[], b: string[]): string[] {
  const setB = new Set(b);
  return a.filter((item) => !setB.has(item)).sort();
}

function main(): void {
  const args = new Set(process.argv.slice(2));
  const scopeArg = Array.from(args).find((arg) => arg.startsWith("--scope="));
  const rawScope = scopeArg ? scopeArg.split("=")[1] : "generated";
  const scope = "generated";
  if (rawScope !== "generated") {
    console.warn(
      `[tokens/report-drift] Ignoring unsupported scope "${rawScope}". Only "generated" is supported.`
    );
  }
  const failOnDrift = args.has("--fail-on-drift");
  const asJson = args.has("--json");

  const tokensTsKeys = Object.keys(baseTokens).sort();

  const generatedExists = fs.existsSync(GENERATED_CSS_PATH);
  const generatedCssVars = generatedExists ? readCssVars(GENERATED_CSS_PATH) : [];
  const generatedCssVarsNormalized = generatedCssVars.length ? normalize(generatedCssVars) : [];

  const missingFromGeneratedCss = generatedCssVarsNormalized.length
    ? diff(tokensTsKeys, generatedCssVarsNormalized)
    : undefined;
  const extrasInGeneratedCss = generatedCssVarsNormalized.length
    ? diff(generatedCssVarsNormalized, tokensTsKeys)
    : undefined;

  const report: DriftReport = {
    source: {
      tokensTsPath: TOKENS_TS_PATH,
      generatedTokensCssPath: generatedExists ? GENERATED_CSS_PATH : undefined,
    },
    counts: {
      tokensTsKeys: tokensTsKeys.length,
      generatedCssVars: generatedExists ? generatedCssVars.length : undefined,
      generatedCssVarsNormalized: generatedExists ? generatedCssVarsNormalized.length : undefined,
    },
    missingFromGeneratedCss,
    extrasInGeneratedCss,
  };

  if (asJson) {
    process.stdout.write(JSON.stringify(report, null, 2) + "\n");
  } else {
    console.log("\nToken Drift Report\n");
    console.log("Source:");
    console.log(`- tokens.ts: ${report.source.tokensTsPath}`);
    if (report.source.generatedTokensCssPath) {
      console.log(`- generated tokens.css: ${report.source.generatedTokensCssPath}`);
    } else {
      console.log("- generated tokens.css: (missing)");
    }
    console.log("");

    console.log("Counts:");
    console.log(`- tokens.ts keys: ${report.counts.tokensTsKeys}`);
    if (report.counts.generatedCssVars !== undefined) {
      console.log(`- generated tokens.css vars: ${report.counts.generatedCssVars}`);
      console.log(
        `- generated tokens.css vars (normalized): ${report.counts.generatedCssVarsNormalized}`
      );
    }
    console.log("");

  }

  if (!asJson && missingFromGeneratedCss) {
    console.log(`Missing from generated tokens.css (normalized): ${missingFromGeneratedCss.length}`);
    missingFromGeneratedCss.forEach((t) => console.log(`  - ${t}`));
    console.log("");
  }
  if (!asJson && extrasInGeneratedCss) {
    console.log(`Extras in generated tokens.css (normalized): ${extrasInGeneratedCss.length}`);
    extrasInGeneratedCss.forEach((t) => console.log(`  - ${t}`));
    console.log("");
  }

  if (failOnDrift) {
    let failed = false;
    if (scope === "generated") {
      if (!report.source.generatedTokensCssPath) {
        console.error("[tokens/report-drift] Generated tokens.css not found.");
        failed = true;
      } else if (
        (missingFromGeneratedCss && missingFromGeneratedCss.length) ||
        (extrasInGeneratedCss && extrasInGeneratedCss.length)
      ) {
        console.error("[tokens/report-drift] Drift detected in generated tokens.css.");
        failed = true;
      }
    }
    if (failed) process.exit(1);
  }
}

try {
  main();
} catch (err) {
  console.error("[tokens/report-drift] Failed to compute token drift:", err);
  process.exit(1);
}
