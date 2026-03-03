import * as path from "node:path";

export interface WebsiteBacklogSeed {
  id: string;
  route: string;
  block: string;
  title: string;
  rationale: string;
  dependsOn: string[];
}

export interface MapArtifactDeltaOptions {
  business: string;
  changedPaths: string[];
  repoRoot?: string;
  logisticsApplies?: boolean;
}

export interface MapArtifactDeltaResult {
  ok: boolean;
  changedPaths: string[];
  matchedPaths: string[];
  seeds: WebsiteBacklogSeed[];
  noop: boolean;
}

interface MappingRule {
  id: string;
  matches: (relativePath: string) => boolean;
  requiresLogistics?: boolean;
  seeds: Array<Omit<WebsiteBacklogSeed, "dependsOn">>;
}

const CORE_DEPENDENCIES = ["website-content-packet", "site-content.generated.json"];

const RULES: MappingRule[] = [
  {
    id: "offer",
    matches: (relativePath) =>
      relativePath.endsWith("-offer.md") || relativePath.endsWith("/sell-pack.user.md"),
    seeds: [
      {
        id: "offer-home-copy",
        route: "/[lang]/page",
        block: "home-value-proposition",
        title: "Refresh homepage offer framing from offer delta",
        rationale: "Offer framing changed; homepage hero and trust posture must stay aligned.",
      },
      {
        id: "offer-plp-copy",
        route: "/[lang]/shop/page",
        block: "collection-intro",
        title: "Refresh PLP intro copy from offer delta",
        rationale: "Offer promise changed; PLP comparison framing must stay consistent.",
      },
      {
        id: "offer-pdp-copy",
        route: "/[lang]/product/[slug]/page",
        block: "product-proof-copy",
        title: "Refresh PDP proof copy from offer delta",
        rationale: "Offer trust and risk-reversal changed; PDP proof bullets need sync.",
      },
    ],
  },
  {
    id: "channels",
    matches: (relativePath) =>
      relativePath.endsWith("-channels.md") || relativePath.endsWith("/sell-pack.user.md"),
    seeds: [
      {
        id: "channels-cta",
        route: "/[lang]/page",
        block: "primary-cta-language",
        title: "Refresh CTA language from channels delta",
        rationale: "Channel strategy changed; CTA copy path must mirror acquisition intent.",
      },
    ],
  },
  {
    id: "logistics",
    matches: (relativePath) => relativePath.endsWith("/logistics-pack.user.md"),
    requiresLogistics: true,
    seeds: [
      {
        id: "logistics-shipping",
        route: "/[lang]/shipping/page",
        block: "shipping-policy",
        title: "Refresh shipping policy copy from logistics delta",
        rationale: "Logistics source changed; shipping policy must remain source-traceable.",
      },
      {
        id: "logistics-returns",
        route: "/[lang]/returns/page",
        block: "returns-policy",
        title: "Refresh returns policy copy from logistics delta",
        rationale: "Logistics source changed; returns policy must remain source-traceable.",
      },
    ],
  },
];

function toRelative(repoRoot: string, inputPath: string): string {
  const normalized = inputPath.replaceAll("\\", "/");
  if (normalized.startsWith("docs/") || normalized.startsWith("data/") || normalized.startsWith("apps/")) {
    return normalized;
  }
  const absolute = path.resolve(repoRoot, inputPath);
  return path.relative(repoRoot, absolute).replaceAll("\\", "/");
}

function dedupeSeeds(seeds: WebsiteBacklogSeed[]): WebsiteBacklogSeed[] {
  const byId = new Map<string, WebsiteBacklogSeed>();
  for (const seed of seeds) {
    if (!byId.has(seed.id)) {
      byId.set(seed.id, seed);
    }
  }
  return [...byId.values()].sort((a, b) => a.id.localeCompare(b.id));
}

export function mapArtifactDeltaToWebsiteBacklog(
  options: MapArtifactDeltaOptions,
): MapArtifactDeltaResult {
  const repoRoot = path.resolve(options.repoRoot ?? process.cwd());
  const changedPaths = options.changedPaths
    .map((item) => toRelative(repoRoot, item))
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));

  const seeds: WebsiteBacklogSeed[] = [];
  const matchedPaths = new Set<string>();

  for (const changedPath of changedPaths) {
    for (const rule of RULES) {
      if (!rule.matches(changedPath)) {
        continue;
      }
      if (rule.requiresLogistics && !options.logisticsApplies) {
        continue;
      }

      matchedPaths.add(changedPath);
      for (const seed of rule.seeds) {
        seeds.push({
          ...seed,
          id: `WEBSITE-02-${seed.id}`,
          dependsOn: [...CORE_DEPENDENCIES],
        });
      }
    }
  }

  const uniqueSeeds = dedupeSeeds(seeds);

  return {
    ok: true,
    changedPaths,
    matchedPaths: [...matchedPaths].sort((a, b) => a.localeCompare(b)),
    seeds: uniqueSeeds,
    noop: uniqueSeeds.length === 0,
  };
}

type CliOptions = {
  business: string;
  changedPaths: string[];
  logisticsApplies: boolean;
};

function parseCliArgs(argv: string[]): CliOptions {
  const options: CliOptions = {
    business: "",
    changedPaths: [],
    logisticsApplies: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--business") {
      options.business = String(argv[i + 1] ?? "").trim();
      i += 1;
      continue;
    }
    if (token === "--changed") {
      options.changedPaths.push(String(argv[i + 1] ?? "").trim());
      i += 1;
      continue;
    }
    if (token === "--logistics") {
      options.logisticsApplies = true;
      continue;
    }
  }

  return options;
}

function runCli() {
  const args = parseCliArgs(process.argv.slice(2));
  if (!args.business || args.changedPaths.length === 0) {
    console.error(
      "[map-artifact-delta-to-website-backlog] Usage: pnpm --filter scripts startup-loop:map-artifact-delta-to-website-backlog -- --business <BIZ> --changed <path> [--changed <path> ...] [--logistics]",
    );
    process.exitCode = 2;
    return;
  }

  const result = mapArtifactDeltaToWebsiteBacklog({
    business: args.business,
    changedPaths: args.changedPaths,
    logisticsApplies: args.logisticsApplies,
  });

  console.log(JSON.stringify(result, null, 2));
}

if (process.argv[1]?.includes("map-artifact-delta-to-website-backlog")) {
  runCli();
}
