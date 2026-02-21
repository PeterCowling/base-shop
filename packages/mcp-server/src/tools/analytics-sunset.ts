import { promises as fs } from "node:fs";
import path from "node:path";

import type { ToolCallResult } from "./policy.js";

type SunsetStatus = {
  schemaVersion: string;
  sunsetActive: boolean;
  sunsetEffectiveAt: string | null;
  consecutiveFullCoverageRuns: number;
};

function buildSunsetError(toolName: string, details: Record<string, unknown>): ToolCallResult {
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(
          {
            error: {
              code: "FORBIDDEN_STAGE",
              message: `Tool ${toolName} is sunset for startup-loop contexts; use measure_* tools.`,
              retryable: false,
              details,
            },
          },
          null,
          2
        ),
      },
    ],
    isError: true,
  };
}

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function analyticsSunsetStatusPathForBusiness(business: string): string {
  const artifactRoot = process.env.STARTUP_LOOP_ARTIFACT_ROOT?.trim() || process.cwd();
  return path.join(
    artifactRoot,
    "docs/business-os/startup-baselines",
    business,
    "coverage",
    "analytics-sunset-status.json"
  );
}

async function readAnalyticsSunsetStatus(business: string): Promise<SunsetStatus | null> {
  try {
    const content = await fs.readFile(analyticsSunsetStatusPathForBusiness(business), "utf-8");
    const parsed = JSON.parse(content) as Record<string, unknown>;
    if (!isObjectRecord(parsed)) {
      return null;
    }
    if (typeof parsed.schemaVersion !== "string" || parsed.schemaVersion !== "analytics-sunset.v1") {
      return null;
    }
    return {
      schemaVersion: parsed.schemaVersion,
      sunsetActive: parsed.sunsetActive === true,
      sunsetEffectiveAt:
        typeof parsed.sunsetEffectiveAt === "string" ? parsed.sunsetEffectiveAt : null,
      consecutiveFullCoverageRuns:
        typeof parsed.consecutiveFullCoverageRuns === "number"
          ? parsed.consecutiveFullCoverageRuns
          : 0,
    };
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "ENOENT") {
      return null;
    }
    throw error;
  }
}

export async function preflightAnalyticsSunsetGate(
  toolName: string,
  args: unknown
): Promise<ToolCallResult | null> {
  if (!toolName.startsWith("analytics_")) {
    return null;
  }
  if (!isObjectRecord(args)) {
    return null;
  }
  if (typeof args.current_stage !== "string" || args.current_stage.length === 0) {
    return null;
  }
  if (typeof args.business !== "string" || args.business.length === 0) {
    return null;
  }

  const sunsetStatus = await readAnalyticsSunsetStatus(args.business);
  if (!sunsetStatus?.sunsetActive) {
    return null;
  }

  return buildSunsetError(toolName, {
    business: args.business,
    current_stage: args.current_stage,
    sunsetEffectiveAt: sunsetStatus.sunsetEffectiveAt,
    consecutiveFullCoverageRuns: sunsetStatus.consecutiveFullCoverageRuns,
    requiredToolFamily: "measure_*",
  });
}
