import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

type PreflightCode =
  | "BRK_NEXT_CONFIG_MISSING"
  | "BRK_ROBOTS_ROUTE_MISSING"
  | "BRK_ROBOTS_ROUTE_INVALID"
  | "BRK_STATIC_REQUIRED_FILE_MISSING"
  | "BRK_STATIC_MISSING_GENERATE_STATIC_PARAMS"
  | "BRK_DEPLOY_CONFIG_MISSING"
  | "BRK_DEPLOY_CONFIG_MISSING_FIELD"
  | "BRK_PREFLIGHT_INTERNAL";

export type PreflightIssue = {
  code: PreflightCode;
  message: string;
  path?: string;
};

export type BrikettePreflightResult = {
  ok: boolean;
  errors: PreflightIssue[];
  warnings: PreflightIssue[];
};

export type PreflightOptions = {
  repoRoot?: string;
};

export type PreflightFs = {
  existsSync: (targetPath: string) => boolean;
  readFileSync: (targetPath: string, encoding: "utf8") => string;
};

export type PreflightDeps = {
  fs?: PreflightFs;
};

const BRIKETTE_ROOT = "apps/brikette";
const NEXT_CONFIG_CANDIDATES = [
  "next.config.ts",
  "next.config.mjs",
  "next.config.js",
];
const ROBOTS_ROUTE_PATH = "src/app/robots.txt/route.ts";
const REQUIRED_STATIC_EXPORT_FILES = [
  "src/app/[lang]/guides/[...slug]/page.tsx",
  "src/app/[lang]/draft/[...slug]/page.tsx",
  "src/app/api/guides/[guideKey]/manifest/route.ts",
  "src/app/api/guides/[guideKey]/route.ts",
  "src/app/api/guides/[guideKey]/audit/route.ts",
];
const REQUIRED_WRANGLER_TOP_LEVEL_FIELDS = [
  "name",
  "main",
  "compatibility_date",
];
const REQUIRED_WRANGLER_ASSETS_FIELDS = [
  "directory",
  "binding",
];

function parseTomlFields(content: string): {
  topLevel: Set<string>;
  sections: Map<string, Set<string>>;
} {
  const topLevel = new Set<string>();
  const sections = new Map<string, Set<string>>();
  let currentSection: string | null = null;

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const sectionMatch = line.match(/^\[([^\]]+)\]$/);
    if (sectionMatch) {
      currentSection = sectionMatch[1].trim();
      if (!sections.has(currentSection)) {
        sections.set(currentSection, new Set<string>());
      }
      continue;
    }

    const keyMatch = line.match(/^([A-Za-z0-9_]+)\s*=/);
    if (!keyMatch) continue;

    const key = keyMatch[1];
    if (currentSection) {
      const keys = sections.get(currentSection) ?? new Set<string>();
      keys.add(key);
      sections.set(currentSection, keys);
    } else {
      topLevel.add(key);
    }
  }

  return { topLevel, sections };
}

function relPath(appPath: string, absolutePath: string): string {
  const relative = path.relative(appPath, absolutePath).replace(/\\/g, "/");
  return relative.length > 0 ? `apps/brikette/${relative}` : "apps/brikette";
}

export function runBriketteDeployPreflight(
  options: PreflightOptions = {},
  deps: PreflightDeps = {},
): BrikettePreflightResult {
  const fs = deps.fs ?? { existsSync, readFileSync };
  const repoRoot = options.repoRoot ?? process.cwd();
  const appPath = path.join(repoRoot, BRIKETTE_ROOT);

  const errors: PreflightIssue[] = [];
  const warnings: PreflightIssue[] = [];

  const pushError = (issue: PreflightIssue): void => {
    errors.push(issue);
  };

  try {
    const hasNextConfig = NEXT_CONFIG_CANDIDATES.some((candidate) =>
      fs.existsSync(path.join(appPath, candidate)),
    );
    if (!hasNextConfig) {
      pushError({
        code: "BRK_NEXT_CONFIG_MISSING",
        message: `No Next config found (expected one of: ${NEXT_CONFIG_CANDIDATES.join(", ")})`,
        path: "apps/brikette",
      });
    }

    const robotsRouteAbs = path.join(appPath, ROBOTS_ROUTE_PATH);
    if (!fs.existsSync(robotsRouteAbs)) {
      pushError({
        code: "BRK_ROBOTS_ROUTE_MISSING",
        message: "Robots route is required for static-export deploys.",
        path: relPath(appPath, robotsRouteAbs),
      });
    } else {
      const robotsContent = fs.readFileSync(robotsRouteAbs, "utf8");
      const hasGetExport =
        robotsContent.includes("export function GET") ||
        robotsContent.includes("export const GET");
      if (!hasGetExport) {
        pushError({
          code: "BRK_ROBOTS_ROUTE_INVALID",
          message: "Robots route must export GET() to avoid page-data build failures.",
          path: relPath(appPath, robotsRouteAbs),
        });
      }
    }

    for (const requiredPath of REQUIRED_STATIC_EXPORT_FILES) {
      const absolutePath = path.join(appPath, requiredPath);
      if (!fs.existsSync(absolutePath)) {
        pushError({
          code: "BRK_STATIC_REQUIRED_FILE_MISSING",
          message: "Required static-export route file is missing.",
          path: relPath(appPath, absolutePath),
        });
        continue;
      }

      const content = fs.readFileSync(absolutePath, "utf8");
      if (!content.includes("generateStaticParams")) {
        pushError({
          code: "BRK_STATIC_MISSING_GENERATE_STATIC_PARAMS",
          message:
            "Route must define generateStaticParams() for static-export compatibility.",
          path: relPath(appPath, absolutePath),
        });
      }
    }

    const wranglerPath = path.join(appPath, "wrangler.toml");
    if (!fs.existsSync(wranglerPath)) {
      pushError({
        code: "BRK_DEPLOY_CONFIG_MISSING",
        message: "wrangler.toml is required for Brikette deploy preflight.",
        path: relPath(appPath, wranglerPath),
      });
    } else {
      const wranglerContent = fs.readFileSync(wranglerPath, "utf8");
      const parsed = parseTomlFields(wranglerContent);

      for (const field of REQUIRED_WRANGLER_TOP_LEVEL_FIELDS) {
        if (!parsed.topLevel.has(field)) {
          pushError({
            code: "BRK_DEPLOY_CONFIG_MISSING_FIELD",
            message: `wrangler.toml is missing required top-level field "${field}".`,
            path: relPath(appPath, wranglerPath),
          });
        }
      }

      const assetsFields = parsed.sections.get("assets") ?? new Set<string>();
      for (const field of REQUIRED_WRANGLER_ASSETS_FIELDS) {
        if (!assetsFields.has(field)) {
          pushError({
            code: "BRK_DEPLOY_CONFIG_MISSING_FIELD",
            message: `wrangler.toml [assets] is missing required field "${field}".`,
            path: relPath(appPath, wranglerPath),
          });
        }
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      ok: false,
      errors: [
        {
          code: "BRK_PREFLIGHT_INTERNAL",
          message: `Unexpected preflight failure: ${message}`,
        },
      ],
      warnings: [],
    };
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings,
  };
}

type CliOptions = {
  repoRoot?: string;
  asJson: boolean;
};

function parseCliArgs(argv: string[]): CliOptions {
  const options: CliOptions = { asJson: false };

  const consumeValue = (index: number, flag: string): string => {
    const value = argv[index + 1];
    if (!value || value.startsWith("--")) {
      throw new Error(`Missing value for ${flag}`);
    }
    return value;
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--") continue;

    if (arg === "--repo-root") {
      options.repoRoot = consumeValue(index, arg);
      index += 1;
      continue;
    }

    if (arg === "--json") {
      options.asJson = true;
      continue;
    }

    if (arg === "--help" || arg === "-h") {
      console.log(`Usage:
  pnpm preflight:brikette-deploy
  pnpm preflight:brikette-deploy -- --repo-root /path/to/repo
  pnpm preflight:brikette-deploy -- --json
`);
      process.exit(0);
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
}

function printHumanResult(result: BrikettePreflightResult): void {
  if (result.ok) {
    console.log("[brikette-preflight] PASS");
    return;
  }

  console.error("[brikette-preflight] FAIL");
  for (const issue of result.errors) {
    const location = issue.path ? ` (${issue.path})` : "";
    console.error(`- [${issue.code}] ${issue.message}${location}`);
  }
}

function main(): void {
  const options = parseCliArgs(process.argv.slice(2));
  const result = runBriketteDeployPreflight({ repoRoot: options.repoRoot });

  if (options.asJson) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    printHumanResult(result);
  }

  if (!result.ok) {
    process.exitCode = 1;
  }
}

if (process.argv[1]?.includes("preflight-deploy")) {
  main();
}
