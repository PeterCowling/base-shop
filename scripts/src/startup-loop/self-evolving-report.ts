import { readFileSync } from "node:fs";
import path from "node:path";

import { evaluateMatureBoundary } from "./self-evolving-boundary.js";
import type {
  ImprovementCandidate,
  MetaObservation,
} from "./self-evolving-contracts.js";
import { buildDashboardSnapshot } from "./self-evolving-dashboard.js";

interface CliArgs {
  observationsPath: string;
  candidatesPath: string;
  business: string;
}

function parseArgs(argv: string[]): CliArgs {
  const flags = new Map<string, string>();
  for (let index = 0; index < argv.length; index++) {
    const key = argv[index];
    if (!key?.startsWith("--")) continue;
    const value = argv[index + 1];
    if (!value || value.startsWith("--")) continue;
    flags.set(key.slice(2), value);
    index += 1;
  }
  return {
    observationsPath:
      flags.get("observations") ??
      path.join(
        "docs",
        "business-os",
        "startup-loop",
        "self-evolving",
        "BRIK",
        "observations.jsonl",
      ),
    candidatesPath:
      flags.get("candidates") ??
      path.join(
        "docs",
        "business-os",
        "startup-loop",
        "self-evolving",
        "BRIK",
        "candidates.json",
      ),
    business: flags.get("business") ?? "BRIK",
  };
}

function readObservations(filePath: string): MetaObservation[] {
  try {
    const raw = readFileSync(filePath, "utf-8").trim();
    if (!raw) return [];
    return raw
      .split("\n")
      .filter((line) => line.trim().length > 0)
      .map((line) => JSON.parse(line) as MetaObservation);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
}

function readCandidates(filePath: string): ImprovementCandidate[] {
  try {
    const raw = readFileSync(filePath, "utf-8");
    const parsed = JSON.parse(raw) as
      | ImprovementCandidate[]
      | { candidates?: Array<{ candidate: ImprovementCandidate }> };
    if (Array.isArray(parsed)) return parsed;
    if (Array.isArray(parsed.candidates)) {
      return parsed.candidates.map((entry) => entry.candidate);
    }
    return [];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
}

function main(): void {
  const args = parseArgs(process.argv.slice(2));
  const observations = readObservations(args.observationsPath);
  const candidates = readCandidates(args.candidatesPath);

  const dashboard = buildDashboardSnapshot({
    observations,
    candidates,
    wipCap: 10,
  });

  const boundary = evaluateMatureBoundary(
    {
      monthly_revenue: 0,
      headcount: 1,
      support_ticket_volume_per_week: 0,
      multi_region_compliance_flag: false,
      operational_complexity_score: 1,
    },
    {
      monthly_revenue: 10000,
      headcount: 5,
      support_ticket_volume_per_week: 100,
      operational_complexity_score: 6,
    },
  );

  const report = {
    business: args.business,
    generated_at: new Date().toISOString(),
    dashboard,
    boundary,
  };
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
}

if (process.argv[1]?.includes("self-evolving-report")) {
  main();
}
