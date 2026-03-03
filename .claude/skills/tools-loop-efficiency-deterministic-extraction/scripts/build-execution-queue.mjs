#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const DEFAULT_ANALYSIS =
  "docs/plans/startup-loop-token-efficiency-v2/deterministic-extraction-analysis.md";
const DEFAULT_OUTPUT =
  "docs/plans/startup-loop-token-efficiency-v2/auto-opportunity-implementation/analysis-execution-queue.md";

function parseArgs(argv) {
  const args = {
    analysis: DEFAULT_ANALYSIS,
    output: DEFAULT_OUTPUT,
    decisions: new Set(["Implement now", "Backlog"]),
    dryRun: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--analysis") {
      args.analysis = argv[++i];
    } else if (token === "--output") {
      args.output = argv[++i];
    } else if (token === "--decisions") {
      args.decisions = new Set(
        argv[++i]
          .split(",")
          .map((item) => item.trim().toLowerCase())
          .filter(Boolean)
          .map((item) => {
            if (item === "implement-now" || item === "implement") return "Implement now";
            if (item === "backlog") return "Backlog";
            if (item === "do-not-implement" || item === "no") return "Do not implement";
            throw new Error(`Unknown decision selector: ${item}`);
          }),
      );
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
  console.log(`Usage:\n  node build-execution-queue.mjs [options]\n\nOptions:\n  --analysis <path>        Analysis markdown path\n  --output <path>          Queue markdown output path\n  --decisions <list>       Comma list: implement-now,backlog,do-not-implement\n  --dry-run                Print summary only, do not write\n  -h, --help               Show help`);
}

function splitRow(line) {
  return line
    .split("|")
    .slice(1, -1)
    .map((cell) => cell.trim());
}

function parsePaybackRows(markdown) {
  const lines = markdown.split("\n");
  const headerIdx = lines.findIndex(
    (line) => line.startsWith("| # |") && line.includes("| Candidate | Priority score |"),
  );
  if (headerIdx === -1) {
    throw new Error("Payback scorecard table not found in analysis markdown.");
  }
  const headerCells = splitRow(lines[headerIdx]).map((cell) => cell.toLowerCase());
  const idx = {
    id: headerCells.indexOf("#"),
    candidate: headerCells.indexOf("candidate"),
    priorityScore: headerCells.indexOf("priority score"),
    paybackMonths: headerCells.indexOf("payback months"),
    paybackROI: headerCells.indexOf("payback roi"),
    expectedROI: headerCells.indexOf("expected roi"),
    decision: headerCells.indexOf("decision"),
  };
  if (
    idx.id === -1 ||
    idx.candidate === -1 ||
    idx.priorityScore === -1 ||
    idx.paybackMonths === -1 ||
    idx.paybackROI === -1 ||
    idx.decision === -1
  ) {
    throw new Error("Payback scorecard header is missing required columns.");
  }

  const rows = [];
  for (let i = headerIdx + 2; i < lines.length; i += 1) {
    const line = lines[i];
    if (!line.startsWith("|")) {
      break;
    }
    const cells = splitRow(line);
    if (cells.length < Math.max(...Object.values(idx).filter((value) => value >= 0)) + 1) {
      continue;
    }

    const id = Number(cells[idx.id]);
    if (!Number.isFinite(id)) {
      continue;
    }

    rows.push({
      source: "core",
      key: `core-${id}`,
      id,
      candidate: cells[idx.candidate],
      priorityScore: Number(cells[idx.priorityScore]),
      paybackMonths: Number(cells[idx.paybackMonths]),
      paybackROI: Number(String(cells[idx.paybackROI]).replace(/x$/i, "")),
      expectedROI:
        idx.expectedROI >= 0
          ? Number(String(cells[idx.expectedROI]).replace(/x$/i, ""))
          : Number.NaN,
      decision: cells[idx.decision],
      signal: "",
      notes: "",
    });
  }

  return rows;
}

function parseScoutRows(markdown) {
  const lines = markdown.split("\n");
  const headerIdx = lines.findIndex(
    (line) => line.startsWith("| Key |") && line.includes("| Skill | Signal | Tier | Metric |"),
  );
  if (headerIdx === -1) {
    return [];
  }
  const headerCells = splitRow(lines[headerIdx]).map((cell) => cell.toLowerCase());
  const idx = {
    key: headerCells.indexOf("key"),
    skill: headerCells.indexOf("skill"),
    signal: headerCells.indexOf("signal"),
    priorityScore: headerCells.indexOf("priority score"),
    paybackMonths: headerCells.indexOf("payback months"),
    paybackROI: headerCells.indexOf("payback roi"),
    expectedROI: headerCells.indexOf("expected roi"),
    decision: headerCells.indexOf("decision"),
    notes: headerCells.indexOf("notes"),
  };
  if (
    idx.key === -1 ||
    idx.skill === -1 ||
    idx.signal === -1 ||
    idx.priorityScore === -1 ||
    idx.paybackMonths === -1 ||
    idx.paybackROI === -1 ||
    idx.decision === -1 ||
    idx.notes === -1
  ) {
    throw new Error("Auto-scout register header is missing required columns.");
  }

  const rows = [];
  for (let i = headerIdx + 2; i < lines.length; i += 1) {
    const line = lines[i];
    if (!line.startsWith("|")) {
      break;
    }
    const cells = splitRow(line);
    if (cells.length < Math.max(...Object.values(idx).filter((value) => value >= 0)) + 1) {
      continue;
    }

    rows.push({
      source: "scout",
      key: cells[idx.key],
      id: null,
      candidate: cells[idx.skill],
      signal: cells[idx.signal],
      priorityScore: Number(cells[idx.priorityScore]),
      paybackMonths: Number(cells[idx.paybackMonths]),
      paybackROI: Number(String(cells[idx.paybackROI]).replace(/x$/i, "")),
      expectedROI:
        idx.expectedROI >= 0
          ? Number(String(cells[idx.expectedROI]).replace(/x$/i, ""))
          : Number.NaN,
      decision: cells[idx.decision],
      notes: cells[idx.notes],
    });
  }

  return rows;
}

function queueNotes(item) {
  if (item.source === "core") {
    return `Use candidate #${item.id} implementation notes and proposed artifacts in analysis.md.`;
  }
  if (item.signal === "H1") {
    return "Modularize/orchestrator trim opportunity from audit; prefer thin orchestrator + module extraction.";
  }
  if (item.signal === "H2") {
    return "Dispatch-candidate from audit; adopt dispatch contract only when domains are parallelizable.";
  }
  if (item.signal === "H3") {
    return "Wave-dispatch advisory; add protocol reference only if execution actually runs in waves.";
  }
  return item.notes || "";
}

function formatNumber(value, digits = 2) {
  if (!Number.isFinite(value)) {
    return "n/a";
  }
  return value.toFixed(digits);
}

function sanitizeCell(value) {
  return String(value).replace(/\|/g, "\\|").trim();
}

function buildQueueMarkdown(items, analysisPath, decisions) {
  const now = new Date().toISOString();
  const lines = [];

  lines.push("---");
  lines.push("Type: OpportunityQueue");
  lines.push(`Generated: ${now}`);
  lines.push(`Source: ${analysisPath}`);
  lines.push(`Decisions: ${[...decisions].join(", ")}`);
  lines.push("Status: Active");
  lines.push("---");
  lines.push("");
  lines.push("# Auto Opportunity Execution Queue");
  lines.push("");
  lines.push("Generated from analysis payback categories. Default order is Implement now, then Backlog.");
  lines.push("");
  lines.push(
    "| Queue-ID | Source | Candidate | Decision | Payback months | Payback ROI | Expected ROI | Status | Execution notes |",
  );
  lines.push("|---|---|---|---|---:|---:|---:|---|---|");

  for (const item of items) {
    const queueId = item.source === "core" ? `CORE-${item.id}` : `SCOUT-${item.key}`;
    lines.push(
      `| ${sanitizeCell(queueId)} | ${item.source} | ${sanitizeCell(item.candidate)} | ${item.decision} | ${formatNumber(item.paybackMonths)} | ${formatNumber(item.paybackROI)}x | ${formatNumber(item.expectedROI)}x | Pending | ${sanitizeCell(queueNotes(item))} |`,
    );
  }

  lines.push("");
  lines.push("## Execution Protocol");
  lines.push("");
  lines.push("1. Execute all `Implement now` rows first, top-to-bottom.");
  lines.push("2. Execute all `Backlog` rows second, top-to-bottom.");
  lines.push("3. After each implementation, update `Status` and append validation evidence in this file.");
  lines.push("4. If blocked, set `Status=Blocked` with reason and continue to next row.");

  return lines.join("\n");
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!fs.existsSync(args.analysis)) {
    throw new Error(`Analysis markdown not found: ${args.analysis}`);
  }

  const markdown = fs.readFileSync(args.analysis, "utf8");
  const coreRows = parsePaybackRows(markdown);
  const scoutRows = parseScoutRows(markdown);

  const all = [...coreRows, ...scoutRows].filter((row) => args.decisions.has(row.decision));

  const rank = {
    "Implement now": 1,
    Backlog: 2,
    "Do not implement": 3,
  };

  all.sort((a, b) => {
    const decisionRank = rank[a.decision] - rank[b.decision];
    if (decisionRank !== 0) return decisionRank;
    const expectedA = Number.isFinite(a.expectedROI) ? a.expectedROI : -1;
    const expectedB = Number.isFinite(b.expectedROI) ? b.expectedROI : -1;
    if (expectedA !== expectedB) return expectedB - expectedA;
    if (a.paybackMonths !== b.paybackMonths) return a.paybackMonths - b.paybackMonths;
    return b.paybackROI - a.paybackROI;
  });

  const output = buildQueueMarkdown(all, args.analysis, args.decisions);

  if (!args.dryRun) {
    fs.mkdirSync(path.dirname(args.output), { recursive: true });
    fs.writeFileSync(args.output, output);
  }

  console.log(`analysis: ${args.analysis}`);
  console.log(`output: ${args.output}`);
  console.log(`selected rows: ${all.length} (core=${coreRows.filter((r) => args.decisions.has(r.decision)).length}, scout=${scoutRows.filter((r) => args.decisions.has(r.decision)).length})`);
  console.log(args.dryRun ? "mode: dry-run (no write)" : "mode: wrote queue markdown");
}

main();
