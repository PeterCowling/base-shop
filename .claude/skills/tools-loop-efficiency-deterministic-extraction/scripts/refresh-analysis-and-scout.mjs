#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const DEFAULT_ANALYSIS =
  "docs/plans/startup-loop-token-efficiency-v2/deterministic-extraction-analysis.md";
const DEFAULT_AUDIT_DIR = "docs/business-os/platform-capability";
const SECTION_C_HEADING = "## C) Recommended Folder Structure";

function parseArgs(argv) {
  const args = {
    analysis: DEFAULT_ANALYSIS,
    audit: null,
    auditDir: DEFAULT_AUDIT_DIR,
    modelCost: null,
    engineerRate: null,
    realizationProb: null,
    evidenceQuality: null,
    dryRun: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--analysis") {
      args.analysis = argv[++i];
    } else if (token === "--audit") {
      args.audit = argv[++i];
    } else if (token === "--audit-dir") {
      args.auditDir = argv[++i];
    } else if (token === "--model-cost") {
      args.modelCost = Number(argv[++i]);
    } else if (token === "--engineer-rate") {
      args.engineerRate = Number(argv[++i]);
    } else if (token === "--realization-prob") {
      args.realizationProb = Number(argv[++i]);
    } else if (token === "--evidence-quality") {
      args.evidenceQuality = String(argv[++i]).trim().toLowerCase();
    } else if (token === "--dry-run") {
      args.dryRun = true;
    } else if (token === "--help" || token === "-h") {
      printHelp();
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${token}`);
    }
  }

  return args;
}

function printHelp() {
  console.log(`Usage:\n  node refresh-analysis-and-scout.mjs [options]\n\nOptions:\n  --analysis <path>         Analysis markdown path\n  --audit <path>            Specific skill-efficiency-audit markdown\n  --audit-dir <path>        Directory used to auto-pick latest audit\n  --model-cost <number>     Override ModelCostPerMTokUSD\n  --engineer-rate <num>     Override LoadedEngineerRatePerHourUSD\n  --realization-prob <num>  Override realization probability (0,1]\n  --evidence-quality <val>  proxy | observed | measured\n  --dry-run                 Print summary only, do not write\n  -h, --help                Show help`);
}

function splitRow(line) {
  return line
    .split("|")
    .slice(1, -1)
    .map((cell) => cell.trim());
}

function parseCandidateRows(markdown) {
  const lines = markdown.split("\n");
  const headerIdx = lines.findIndex((line) =>
    line.includes("| # | Skill / Sub-step |"),
  );
  if (headerIdx === -1) {
    throw new Error("Could not find candidate table in analysis markdown.");
  }

  const rows = [];
  for (let i = headerIdx + 2; i < lines.length; i += 1) {
    const line = lines[i];
    if (!line.startsWith("|")) {
      break;
    }
    const rowMatch = line.match(
      /^\|\s*(\d+)\s*\|\s*([^|]+?)\s*\|.*\|\s*\*\*(\d+(?:\.\d+)?)\*\*\s*\(F:(\d+)\s+D:(\d+)\s+B:(\d+)\s+M:(\d+)\)\s*\|/,
    );
    if (!rowMatch) {
      continue;
    }

    rows.push({
      id: Number(rowMatch[1]),
      name: rowMatch[2].replace(/\*\*/g, "").trim(),
      priorityScore: Number(rowMatch[3]),
      F: Number(rowMatch[4]),
      D: Number(rowMatch[5]),
      B: Number(rowMatch[6]),
      M: Number(rowMatch[7]),
    });
  }

  if (rows.length === 0) {
    throw new Error("Candidate table was found but no rows were parsed.");
  }

  return rows;
}

function parseAssumptions(
  markdown,
  cliModelCost,
  cliEngineerRate,
  cliRealizationProb,
  cliEvidenceQuality,
) {
  const qualityMap = {
    proxy: 0.5,
    observed: 0.7,
    measured: 0.9,
  };
  const modelMatch = markdown.match(/\| `ModelCostPerMTokUSD` \| `([^`]+)` \|/);
  const rateMatch = markdown.match(
    /\| `LoadedEngineerRatePerHourUSD` \| `([^`]+)` \|/,
  );
  const probMatch = markdown.match(
    /\| `RealizationProbability` \| `([^`]+)` \|/,
  );
  const qualityMatch = markdown.match(
    /\| `RealizationEvidenceQuality` \| `([^`]+)` \|/i,
  );

  const modelCost =
    Number.isFinite(cliModelCost) && cliModelCost > 0
      ? cliModelCost
      : modelMatch
        ? Number(modelMatch[1])
        : 8;
  const engineerRate =
    Number.isFinite(cliEngineerRate) && cliEngineerRate > 0
      ? cliEngineerRate
      : rateMatch
        ? Number(rateMatch[1])
        : 120;
  const evidenceQuality =
    cliEvidenceQuality ??
    (qualityMatch ? String(qualityMatch[1]).trim().toLowerCase() : "proxy");
  const cliQualityProvided =
    typeof cliEvidenceQuality === "string" && cliEvidenceQuality.length > 0;
  if (!qualityMap[evidenceQuality]) {
    throw new Error(
      `Invalid evidence quality: ${evidenceQuality}. Use proxy|observed|measured.`,
    );
  }
  const realizationProb =
    Number.isFinite(cliRealizationProb) && cliRealizationProb > 0
      ? cliRealizationProb
      : cliQualityProvided
        ? qualityMap[evidenceQuality]
        : probMatch
        ? Number(probMatch[1])
        : qualityMap[evidenceQuality];

  if (!Number.isFinite(modelCost) || modelCost <= 0) {
    throw new Error(`Invalid model cost: ${modelCost}`);
  }
  if (!Number.isFinite(engineerRate) || engineerRate <= 0) {
    throw new Error(`Invalid engineer rate: ${engineerRate}`);
  }
  if (!Number.isFinite(realizationProb) || realizationProb <= 0 || realizationProb > 1) {
    throw new Error(`Invalid realization probability: ${realizationProb}`);
  }

  return { modelCost, engineerRate, realizationProb, evidenceQuality };
}

function computePayback(row, { modelCost, engineerRate, realizationProb }) {
  const weeklyTokens = 2500 * row.F + 500 * row.D + 300 * row.B;
  const weeklyHours = 0.16 * row.F + 0.08 * row.B + 0.05 * (5 - row.M);
  const monthlyMaint = 20 + 5 * row.M;
  const buildHours = 6 + 1.4 * row.M + 0.5 * row.B + 0.4 * row.F;

  const monthlyNet =
    ((weeklyTokens * 4.33) / 1_000_000) * modelCost +
    weeklyHours * 4.33 * engineerRate -
    monthlyMaint;
  const buildCost = buildHours * engineerRate;

  let paybackMonths = Number.POSITIVE_INFINITY;
  let paybackROI = 0;
  if (monthlyNet > 0) {
    paybackMonths = buildCost / monthlyNet;
    paybackROI = monthlyNet / (buildCost / 12);
  }
  const expectedMonthlyNet = monthlyNet * realizationProb;
  let expectedPaybackMonths = Number.POSITIVE_INFINITY;
  let expectedROI = 0;
  if (expectedMonthlyNet > 0) {
    expectedPaybackMonths = buildCost / expectedMonthlyNet;
    expectedROI = expectedMonthlyNet / (buildCost / 12);
  }

  return {
    weeklyTokens,
    weeklyHours,
    monthlyMaint,
    buildHours,
    monthlyNet,
    buildCost,
    paybackMonths,
    paybackROI,
    expectedMonthlyNet,
    expectedPaybackMonths,
    expectedROI,
    decision: classifyDecision(paybackMonths, paybackROI),
  };
}

function classifyDecision(paybackMonths, paybackROI) {
  if (paybackMonths <= 3 && paybackROI >= 4) {
    return "Implement now";
  }
  if (paybackMonths <= 6 && paybackROI >= 2) {
    return "Backlog";
  }
  return "Do not implement";
}

function formatNumber(value, digits = 2) {
  if (!Number.isFinite(value)) {
    return "n/a";
  }
  return value.toFixed(digits);
}

function formatCurrency(value) {
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

function sanitizeCell(value) {
  return String(value).replace(/\|/g, "\\|").trim();
}

function stripBackticks(value) {
  return value.replace(/`/g, "").trim();
}

function buildPaybackSection(rows, assumptions) {
  const computed = rows.map((row) => ({ row, payback: computePayback(row, assumptions) }));

  const summaryCounts = {
    implement: 0,
    backlog: 0,
    no: 0,
  };

  const lines = [];
  lines.push("### Payback Scorecard (estimated)");
  lines.push("");
  lines.push(
    "Because the current artifacts do not yet have measured per-candidate telemetry for all 20 items,",
  );
  lines.push("the payback inputs below are estimated from the deterministic row factors.");
  lines.push("");
  lines.push("Assumptions used for this score update:");
  lines.push("");
  lines.push("| Input | Value |");
  lines.push("|---|---|");
  lines.push(`| \`ModelCostPerMTokUSD\` | \`${formatCurrency(assumptions.modelCost)}\` |`);
  lines.push(
    `| \`LoadedEngineerRatePerHourUSD\` | \`${formatCurrency(assumptions.engineerRate)}\` |`,
  );
  lines.push(
    `| \`RealizationEvidenceQuality\` | \`${assumptions.evidenceQuality}\` |`,
  );
  lines.push(
    `| \`RealizationProbability\` | \`${formatNumber(assumptions.realizationProb)}\` |`,
  );
  lines.push("| `MonthlyMaintenanceCostUSD` | `20 + (5 × M)` |");
  lines.push("| `WeeklyTokensSaved` proxy | `(2500 × F) + (500 × D) + (300 × B)` |");
  lines.push(
    "| `EngineerHoursSavedPerWeek` proxy | `(0.16 × F) + (0.08 × B) + (0.05 × (5 - M))` |",
  );
  lines.push(
    "| `BuildCostUSD` proxy | `(6 + (1.4 × M) + (0.5 × B) + (0.4 × F)) × LoadedEngineerRatePerHourUSD` |",
  );
  lines.push("");
  lines.push("Updated scores using the new payback metric:");
  lines.push("");
  lines.push(
    "| # | Candidate | Priority score | Payback months | Payback ROI | Expected ROI | Decision |",
  );
  lines.push("|---|---|---:|---:|---:|---:|---|");

  for (const item of computed) {
    const { row, payback } = item;
    const decision = payback.decision;
    if (decision === "Implement now") summaryCounts.implement += 1;
    else if (decision === "Backlog") summaryCounts.backlog += 1;
    else summaryCounts.no += 1;

    lines.push(
      `| ${row.id} | ${sanitizeCell(stripBackticks(row.name))} | ${row.priorityScore.toFixed(1)} | ${formatNumber(payback.paybackMonths)} | ${formatNumber(payback.paybackROI)}x | ${formatNumber(payback.expectedROI)}x | ${decision} |`,
    );
  }

  lines.push("");
  lines.push("Payback summary:");
  lines.push(`- Implement now: ${summaryCounts.implement}`);
  lines.push(`- Backlog: ${summaryCounts.backlog}`);
  lines.push(`- Do not implement: ${summaryCounts.no}`);
  lines.push(
    `- Expected payback-positive (\`ExpectedROI > 1.0x\`): ${computed.filter((item) => item.payback.expectedROI > 1).length}`,
  );

  return { text: lines.join("\n"), computed };
}

function resolveLatestAuditPath(auditPath, auditDir) {
  if (auditPath) {
    if (!fs.existsSync(auditPath)) {
      throw new Error(`Audit file not found: ${auditPath}`);
    }
    return auditPath;
  }

  const entries = fs
    .readdirSync(auditDir)
    .filter((name) => /^skill-efficiency-audit-\d{4}-\d{2}-\d{2}-\d{4}\.md$/.test(name))
    .sort();

  if (entries.length === 0) {
    return null;
  }
  return path.join(auditDir, entries[entries.length - 1]);
}

function estimateMForScout(signal, metricValue) {
  if (signal === "H1") {
    const lines = Number(metricValue);
    if (lines > 350) return 5;
    if (lines > 280) return 4;
    if (lines > 220) return 3;
    return 2;
  }

  const phaseMatches = Number(metricValue);
  if (phaseMatches >= 10) {
    return 4;
  }
  return 3;
}

function signalD(signal) {
  if (signal === "H1") return 5;
  if (signal === "H2") return 4;
  return 3;
}

function tierScore(tier) {
  if (tier === "high") return 5;
  if (tier === "medium") return 4;
  return 3;
}

function priorityScore(F, D, B, M) {
  return F * 0.3 + D * 0.3 + B * 0.2 + (5 - M) * 0.2;
}

function parseNewScoutEntries(auditContent, assumptions) {
  const lines = auditContent.split("\n");
  const entries = [];
  let mode = "none";
  let tier = "low";

  for (const line of lines) {
    if (line.startsWith("## 3. List 1")) {
      mode = "h1";
      continue;
    }
    if (line.startsWith("## 4. List 2")) {
      mode = "h2";
      continue;
    }
    if (line.startsWith("## ") && !line.startsWith("## 3.") && !line.startsWith("## 4.")) {
      mode = "none";
      continue;
    }

    const tierMatch = line.match(/^###\s+(HIGH|MEDIUM|LOW) tier/i);
    if (tierMatch) {
      tier = tierMatch[1].toLowerCase();
      continue;
    }

    if (!line.startsWith("|") || mode === "none") {
      continue;
    }

    const cells = splitRow(line);
    if (cells.length < 2) {
      continue;
    }

    if (
      cells[0] === "Skill" ||
      line.includes("---") ||
      cells[0].startsWith("**") ||
      cells[0] === "Rank"
    ) {
      continue;
    }

    if (mode === "h1" && cells.length >= 5) {
      const skill = cells[0];
      const metric = Number(cells[1]);
      const delta = cells[3];
      const notes = cells[4];
      if (/known/i.test(delta)) {
        continue;
      }

      const F = tierScore(tier);
      const B = tierScore(tier);
      const D = signalD("H1");
      const M = estimateMForScout("H1", metric);
      const score = priorityScore(F, D, B, M);
      const payback = computePayback(
        { F, D, B, M },
        assumptions,
      );

      entries.push({
        key: `H1:${skill}`,
        skill,
        signal: "H1",
        tier,
        metric: `lines=${metric}`,
        metricValue: metric,
        delta,
        notes,
        F,
        D,
        B,
        M,
        score,
        payback,
      });
      continue;
    }

    if (mode === "h2" && cells.length >= 7) {
      const skill = cells[0];
      const phaseMatches = Number(cells[1]);
      const h2 = cells[3];
      const h3 = cells[4];
      const delta = cells[5];
      const notes = cells[6];

      if (/known/i.test(delta)) {
        continue;
      }

      const addSignalEntry = (signal) => {
        const F = tierScore(tier);
        const B = tierScore(tier);
        const D = signalD(signal);
        const M = estimateMForScout(signal, phaseMatches);
        const score = priorityScore(F, D, B, M);
        const payback = computePayback({ F, D, B, M }, assumptions);

        entries.push({
          key: `${signal}:${skill}`,
          skill,
          signal,
          tier,
          metric: `phase_matches=${phaseMatches}`,
          metricValue: phaseMatches,
          delta,
          notes,
          F,
          D,
          B,
          M,
          score,
          payback,
        });
      };

      if (/dispatch-candidate/i.test(h2)) {
        addSignalEntry("H2");
      }
      if (/wave-candidate/i.test(h3)) {
        addSignalEntry("H3");
      }
    }
  }

  const deduped = new Map();
  for (const entry of entries) {
    const existing = deduped.get(entry.key);
    if (!existing || entry.payback.paybackMonths < existing.payback.paybackMonths) {
      deduped.set(entry.key, entry);
    }
  }

  return [...deduped.values()];
}

function buildScoutRegisterSection(entries, auditPath) {
  const source = auditPath ? path.basename(auditPath) : "none";
  const lines = [];
  lines.push("### Auto-Scout Register (new opportunities from latest audit)");
  lines.push("");
  lines.push(`Source audit: \`${source}\``);
  lines.push("");

  if (entries.length === 0) {
    lines.push("No new opportunities were detected (all findings are marked as known).\n");
    return lines.join("\n").trimEnd();
  }

  const decisionRank = {
    "Implement now": 1,
    Backlog: 2,
    "Do not implement": 3,
  };

  const sorted = [...entries].sort((a, b) => {
    const dr = decisionRank[a.payback.decision] - decisionRank[b.payback.decision];
    if (dr !== 0) return dr;
    return a.payback.paybackMonths - b.payback.paybackMonths;
  });

  lines.push(
    "| Key | Skill | Signal | Tier | Metric | Delta | Priority score | Payback months | Payback ROI | Expected ROI | Decision | Notes |",
  );
  lines.push("|---|---|---|---|---|---|---:|---:|---:|---:|---|---|");
  for (const entry of sorted) {
    lines.push(
      `| ${sanitizeCell(entry.key)} | ${sanitizeCell(entry.skill)} | ${entry.signal} | ${entry.tier} | ${sanitizeCell(entry.metric)} | ${sanitizeCell(entry.delta)} | ${formatNumber(entry.score, 1)} | ${formatNumber(entry.payback.paybackMonths)} | ${formatNumber(entry.payback.paybackROI)}x | ${formatNumber(entry.payback.expectedROI)}x | ${entry.payback.decision} | ${sanitizeCell(entry.notes)} |`,
    );
  }

  return lines.join("\n");
}

function updateExtractionSummaries(markdown, scoreById) {
  const replacements = [
    {
      heading: "### Extraction 1: Confidence Threshold Config + Build Eligibility Gate",
      id: 1,
      message: "Highest-priority payback candidate.",
    },
    {
      heading: "### Extraction 2: Plan Frontmatter Schema Validation",
      id: 3,
      message: "Meets implement-now payback gate.",
    },
    {
      heading: "### Extraction 3: lp-do-sequence Topological Sort",
      id: 5,
      message: "Meets implement-now payback gate.",
    },
  ];

  let updated = markdown;
  for (const replacement of replacements) {
    const item = scoreById.get(replacement.id);
    if (!item) {
      continue;
    }

    const line = `**Priority score: ${item.row.priorityScore.toFixed(1)}; Payback: ${formatNumber(item.payback.paybackMonths)} months, ${formatNumber(item.payback.paybackROI)}x ROI (Expected: ${formatNumber(item.payback.expectedROI)}x) — ${replacement.message}**`;
    const escapedHeading = replacement.heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(
      `(${escapedHeading}\\n\\n)\\*\\*Priority score:[^\\n]*\\*\\*`,
      "m",
    );
    updated = updated.replace(regex, `$1${line}`);
  }

  return updated;
}

function replacePaybackBlock(markdown, paybackBlock, registerBlock) {
  const start = markdown.indexOf("### Payback Scorecard (estimated)");
  if (start === -1) {
    throw new Error("Could not find payback section start.");
  }

  const headingIndex = markdown.indexOf(SECTION_C_HEADING, start);
  if (headingIndex === -1) {
    throw new Error(`Could not find section heading: ${SECTION_C_HEADING}`);
  }

  const remainder = markdown.slice(headingIndex + SECTION_C_HEADING.length);

  return (
    markdown.slice(0, start) +
    `${paybackBlock}\n\n${registerBlock}\n\n---\n\n${SECTION_C_HEADING}` +
    remainder
  );
}

function main() {
  const args = parseArgs(process.argv.slice(2));

  const analysisPath = args.analysis;
  if (!fs.existsSync(analysisPath)) {
    throw new Error(`Analysis markdown not found: ${analysisPath}`);
  }

  const original = fs.readFileSync(analysisPath, "utf8");
  const candidates = parseCandidateRows(original);
  const assumptions = parseAssumptions(
    original,
    args.modelCost,
    args.engineerRate,
    args.realizationProb,
    args.evidenceQuality,
  );
  const { text: paybackBlock, computed } = buildPaybackSection(candidates, assumptions);
  const scoreById = new Map(computed.map((item) => [item.row.id, item]));

  const auditPath = resolveLatestAuditPath(args.audit, args.auditDir);
  const scoutEntries = auditPath
    ? parseNewScoutEntries(fs.readFileSync(auditPath, "utf8"), assumptions)
    : [];
  const registerBlock = buildScoutRegisterSection(scoutEntries, auditPath);

  let updated = replacePaybackBlock(original, paybackBlock, registerBlock);
  updated = updateExtractionSummaries(updated, scoreById);

  if (!args.dryRun) {
    fs.writeFileSync(analysisPath, updated);
  }

  const decisionCounts = computed.reduce(
    (acc, item) => {
      if (item.payback.decision === "Implement now") acc.implement += 1;
      else if (item.payback.decision === "Backlog") acc.backlog += 1;
      else acc.no += 1;
      return acc;
    },
    { implement: 0, backlog: 0, no: 0 },
  );

  console.log(`analysis: ${analysisPath}`);
  console.log(`audit: ${auditPath ?? "none"}`);
  console.log(
    `assumptions: modelCost=${assumptions.modelCost}, engineerRate=${assumptions.engineerRate}, realizationProb=${assumptions.realizationProb}, evidenceQuality=${assumptions.evidenceQuality}`,
  );
  console.log(
    `payback decisions: implement=${decisionCounts.implement}, backlog=${decisionCounts.backlog}, do-not-implement=${decisionCounts.no}`,
  );
  console.log(`auto-scout new opportunities: ${scoutEntries.length}`);
  console.log(args.dryRun ? "mode: dry-run (no write)" : "mode: wrote analysis markdown");
}

main();
