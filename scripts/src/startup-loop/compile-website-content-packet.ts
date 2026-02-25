import * as fs from "node:fs";
import * as path from "node:path";

import { parseFrontmatterMarkdown } from "../hypothesis-portfolio/markdown";

type Severity = "error" | "warning";
type SourceStatus = "loaded" | "missing" | "skipped";

interface SourceDefinition {
  domain: string;
  relativePath: string;
  required: "mandatory" | "conditional-mandatory" | "optional";
  note: string;
}

export interface CompileWebsiteContentPacketDiagnostic {
  code:
    | "missing_mandatory_source"
    | "missing_conditional_mandatory_source"
    | "invalid_markdown_frontmatter"
    | "logistics_contract_missing_field"
    | "logistics_contract_invalid_value"
    | "logistics_contract_missing_section";
  severity: Severity;
  message: string;
  sourcePath?: string;
}

export interface WebsiteContentPacketSourceLedgerEntry {
  domain: string;
  path: string;
  required: SourceDefinition["required"];
  status: SourceStatus;
  notes: string;
}

export interface CompileWebsiteContentPacketOptions {
  business: string;
  repoRoot?: string;
  asOfDate?: string;
  write?: boolean;
  businessProfile?: string[];
}

export interface CompileWebsiteContentPacketResult {
  ok: boolean;
  outputPath: string;
  diagnostics: CompileWebsiteContentPacketDiagnostic[];
  sourceLedger: WebsiteContentPacketSourceLedgerEntry[];
  packet?: string;
}

function toPosixRelative(repoRoot: string, absolutePath: string): string {
  return path.relative(repoRoot, absolutePath).replaceAll("\\", "/");
}

function nowIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function ensureArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => String(item).trim())
      .filter(Boolean);
  }
  if (typeof value === "string") {
    return value
      .split(/[\s,|]+/)
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

function detectBusinessProfile(input: {
  explicitProfile?: string[];
  intakeFrontmatter: Record<string, unknown>;
  intakeBody: string;
}): Set<string> {
  const profile = new Set<string>();
  for (const raw of input.explicitProfile ?? []) {
    if (raw.trim()) profile.add(raw.trim().toLowerCase());
  }

  for (const key of [
    "business_profile",
    "business-profile",
    "business-profiles",
    "business_profiles",
    "Business-Profile",
    "Business-Profiles",
  ]) {
    const values = ensureArray(input.intakeFrontmatter[key]);
    for (const value of values) {
      profile.add(value.toLowerCase());
    }
  }

  const intakeLower = input.intakeBody.toLowerCase();
  if (intakeLower.includes("physical product") || intakeLower.includes("physical-product")) {
    profile.add("physical-product");
  }
  if (intakeLower.includes("logistics-heavy") || intakeLower.includes("logistics heavy")) {
    profile.add("logistics-heavy");
  }

  return profile;
}

function buildSourceDefinitions(business: string): SourceDefinition[] {
  return [
    {
      domain: "Intake",
      relativePath: `docs/business-os/startup-baselines/${business}-intake-packet.user.md`,
      required: "mandatory",
      note: "Business constraints and launch context",
    },
    {
      domain: "Offer",
      relativePath: `docs/business-os/startup-baselines/${business}-offer.md`,
      required: "mandatory",
      note: "ICP, positioning, promise, and pricing",
    },
    {
      domain: "Channels",
      relativePath: `docs/business-os/startup-baselines/${business}-channels.md`,
      required: "mandatory",
      note: "Channel language, CTA path, and GTM framing",
    },
    {
      domain: "Product pack",
      relativePath: `docs/business-os/strategy/${business}/product-pack.user.md`,
      required: "optional",
      note: "Product scope and constraints when available",
    },
    {
      domain: "Market pack",
      relativePath: `docs/business-os/strategy/${business}/market-pack.user.md`,
      required: "optional",
      note: "Search and demand context when available",
    },
    {
      domain: "Logistics pack",
      relativePath: `docs/business-os/strategy/${business}/logistics-pack.user.md`,
      required: "conditional-mandatory",
      note: "Policy copy source for physical-product and logistics-heavy profiles",
    },
  ];
}

function requiresLogistics(profile: Set<string>): boolean {
  return profile.has("physical-product") || profile.has("logistics-heavy");
}

function validateLogisticsContract(args: {
  business: string;
  relativePath: string;
  content: string;
}): CompileWebsiteContentPacketDiagnostic[] {
  const diagnostics: CompileWebsiteContentPacketDiagnostic[] = [];
  const parsed = parseFrontmatterMarkdown(args.content);
  if (!parsed.ok) {
    diagnostics.push({
      code: "invalid_markdown_frontmatter",
      severity: "error",
      sourcePath: args.relativePath,
      message: `Logistics pack has invalid frontmatter: ${parsed.error}`,
    });
    return diagnostics;
  }

  const requiredFields = [
    "artifact",
    "business",
    "producer_stage",
    "confidence",
    "last_updated",
    "status",
    "conditional",
    "condition",
  ] as const;

  for (const field of requiredFields) {
    if (!(field in parsed.frontmatter)) {
      diagnostics.push({
        code: "logistics_contract_missing_field",
        severity: "error",
        sourcePath: args.relativePath,
        message: `Logistics pack is missing required frontmatter field '${field}'.`,
      });
    }
  }

  if (parsed.frontmatter.artifact !== "logistics-pack") {
    diagnostics.push({
      code: "logistics_contract_invalid_value",
      severity: "error",
      sourcePath: args.relativePath,
      message: `Logistics pack frontmatter 'artifact' must be 'logistics-pack'.`,
    });
  }

  if (parsed.frontmatter.business !== args.business) {
    diagnostics.push({
      code: "logistics_contract_invalid_value",
      severity: "error",
      sourcePath: args.relativePath,
      message: `Logistics pack frontmatter 'business' must be '${args.business}'.`,
    });
  }

  if (parsed.frontmatter.producer_stage !== "LOGISTICS-07") {
    diagnostics.push({
      code: "logistics_contract_invalid_value",
      severity: "error",
      sourcePath: args.relativePath,
      message: `Logistics pack frontmatter 'producer_stage' must be 'LOGISTICS-07'.`,
    });
  }

  if (parsed.frontmatter.conditional !== true) {
    diagnostics.push({
      code: "logistics_contract_invalid_value",
      severity: "error",
      sourcePath: args.relativePath,
      message: `Logistics pack frontmatter 'conditional' must be true.`,
    });
  }

  if (
    parsed.frontmatter.condition !== "business_profile includes logistics-heavy OR physical-product"
  ) {
    diagnostics.push({
      code: "logistics_contract_invalid_value",
      severity: "error",
      sourcePath: args.relativePath,
      message:
        "Logistics pack frontmatter 'condition' must equal \"business_profile includes logistics-heavy OR physical-product\".",
    });
  }

  const requiredSections = [
    "## ICP Summary",
    "## Key Assumptions",
    "## Confidence",
    "## Evidence Sources",
    "## Open Questions",
    "## Change-log",
  ];

  for (const section of requiredSections) {
    if (!parsed.body.includes(section)) {
      diagnostics.push({
        code: "logistics_contract_missing_section",
        severity: "error",
        sourcePath: args.relativePath,
        message: `Logistics pack is missing required section '${section}'.`,
      });
    }
  }

  return diagnostics;
}

function renderPacket(args: {
  business: string;
  businessName: string;
  asOfDate: string;
  sourceLedger: WebsiteContentPacketSourceLedgerEntry[];
  logisticsRequired: boolean;
}): string {
  const sourceDependsOn = args.sourceLedger
    .filter((row) => row.status === "loaded")
    .map((row) => row.path);

  const sourceLedgerRows = args.sourceLedger
    .map((row) => `| ${row.domain} | \`${row.path}\` | ${row.status} | ${row.notes} |`)
    .join("\n");

  const logisticsBlock = args.logisticsRequired
    ? `
## Logistics Policy Inputs

- Dispatch SLA source: logistics-pack ` +
      `\`docs/business-os/strategy/${args.business}/logistics-pack.user.md\`
- Return-window and condition policy source: logistics-pack ` +
      `\`docs/business-os/strategy/${args.business}/logistics-pack.user.md\`
- Duties/tax payer rule source: logistics-pack ` +
      `\`docs/business-os/strategy/${args.business}/logistics-pack.user.md\`
- Support response SLA source: logistics-pack ` +
      `\`docs/business-os/strategy/${args.business}/logistics-pack.user.md\`
`
    : "";

  const frontmatterDepends = sourceDependsOn.map((entry) => `  - ${entry}`).join("\n");

  return `---
Type: Startup-Content-Packet
Status: Draft
Business: ${args.business}
Business-Name: ${args.businessName}
Created: ${args.asOfDate}
Updated: ${args.asOfDate}
Last-reviewed: ${args.asOfDate}
Owner: startup-loop
artifact: website-content-packet
source_of_truth: true
depends_on:
${frontmatterDepends}
---

# ${args.business} Website Content Packet

## Purpose

Compile startup-loop intake, offer, and channel artifacts into a canonical website content packet for first-build and iteration workflows.

## Refresh Trigger

Refresh this packet whenever intake constraints, offer framing, channels/CTA language, or logistics policy sources change.

## Source Ledger

| Input domain | Canonical source path | Status | Notes |
|---|---|---|---|
${sourceLedgerRows}

## SEO Focus (Launch-Phase)

### Primary transactional terms
- ${args.businessName.toLowerCase()} products
- ${args.businessName.toLowerCase()} shop
- ${args.businessName.toLowerCase()} official site

### Secondary support terms
- ${args.businessName.toLowerCase()} shipping
- ${args.businessName.toLowerCase()} returns
- ${args.businessName.toLowerCase()} support

## Page Intent Map

| Surface | Search/User intent | Required copy blocks | Primary CTA |
|---|---|---|---|
| Home | Understand the offer and trust posture | headline, value proposition, trust points, short FAQ | Shop now |
| Shop/PLP | Compare product families quickly | collection intro, variant differentiators, buying guidance | View product |
| Product/PDP | Validate fit and confidence before checkout | concise summary, evidence-safe bullets, guarantee block | Continue to checkout |
| Support | Resolve shipping/returns/contact friction | response channels, SLA expectations, return path | Contact support |

## Product Copy Matrix

| Product ID | Public name | Slug | One-line description | Evidence constraints |
|---|---|---|---|---|
| TODO-001 | Launch product 1 | launch-product-1 | Populate from product evidence sources before publish. | Must trace to source ledger. |
| TODO-002 | Launch product 2 | launch-product-2 | Populate from product evidence sources before publish. | Must trace to source ledger. |

${logisticsBlock}
## Copy Approval Rules

1. No unsupported compliance/material/performance claims.
2. No copy that cannot be traced to a loaded source in this packet.
3. Keep launch copy concise and reusable across home/shop/PDP/support surfaces.
4. For logistics-required profiles, policy copy must originate from logistics-pack fields.
`;
}

export function compileWebsiteContentPacket(
  options: CompileWebsiteContentPacketOptions,
): CompileWebsiteContentPacketResult {
  const repoRoot = path.resolve(options.repoRoot ?? process.cwd());
  const asOfDate = options.asOfDate ?? nowIsoDate();
  const writeOutput = options.write ?? true;
  const business = options.business.trim();

  const outputPath = path.join(repoRoot, "docs/business-os/startup-baselines", `${business}-content-packet.md`);

  const diagnostics: CompileWebsiteContentPacketDiagnostic[] = [];
  const sourceLedger: WebsiteContentPacketSourceLedgerEntry[] = [];

  const sources = buildSourceDefinitions(business);
  const loadedContents = new Map<string, string>();

  for (const source of sources) {
    const absolutePath = path.join(repoRoot, source.relativePath);
    const relativePath = toPosixRelative(repoRoot, absolutePath);
    const exists = fs.existsSync(absolutePath);

    if (!exists) {
      const row: WebsiteContentPacketSourceLedgerEntry = {
        domain: source.domain,
        path: relativePath,
        required: source.required,
        status: "missing",
        notes: source.note,
      };
      sourceLedger.push(row);

      if (source.required === "mandatory") {
        diagnostics.push({
          code: "missing_mandatory_source",
          severity: "error",
          sourcePath: relativePath,
          message: `Missing mandatory source '${source.domain}' at ${relativePath}.`,
        });
      }
      continue;
    }

    const content = fs.readFileSync(absolutePath, "utf8");
    loadedContents.set(source.domain, content);
    sourceLedger.push({
      domain: source.domain,
      path: relativePath,
      required: source.required,
      status: "loaded",
      notes: source.note,
    });
  }

  const intakeContent = loadedContents.get("Intake");
  const intakeParsed = intakeContent ? parseFrontmatterMarkdown(intakeContent) : null;
  if (intakeContent && intakeParsed && !intakeParsed.ok) {
    diagnostics.push({
      code: "invalid_markdown_frontmatter",
      severity: "error",
      sourcePath: `docs/business-os/startup-baselines/${business}-intake-packet.user.md`,
      message: `Intake source has invalid frontmatter: ${intakeParsed.error}`,
    });
  }

  const profile = detectBusinessProfile({
    explicitProfile: options.businessProfile,
    intakeFrontmatter: intakeParsed && intakeParsed.ok ? intakeParsed.frontmatter : {},
    intakeBody: intakeParsed && intakeParsed.ok ? intakeParsed.body : "",
  });

  const logisticsRequired = requiresLogistics(profile);
  const logisticsRow = sourceLedger.find((row) => row.domain === "Logistics pack");
  const logisticsPath = `docs/business-os/strategy/${business}/logistics-pack.user.md`;

  if (logisticsRow) {
    if (!logisticsRequired) {
      if (logisticsRow.status === "missing") {
        logisticsRow.status = "skipped";
        logisticsRow.notes = "Not applicable for current business profile (absent-safe).";
      } else {
        logisticsRow.notes = "Loaded even though profile does not require logistics.";
      }
    } else if (logisticsRow.status === "missing") {
      diagnostics.push({
        code: "missing_conditional_mandatory_source",
        severity: "error",
        sourcePath: logisticsPath,
        message:
          "Business profile requires logistics-pack (physical-product/logistics-heavy), but the source file is missing.",
      });
    }
  }

  if (logisticsRequired && loadedContents.has("Logistics pack")) {
    diagnostics.push(
      ...validateLogisticsContract({
        business,
        relativePath: logisticsPath,
        content: loadedContents.get("Logistics pack") ?? "",
      }),
    );
  }

  if (diagnostics.some((issue) => issue.severity === "error")) {
    return {
      ok: false,
      outputPath,
      diagnostics,
      sourceLedger,
    };
  }

  const businessName =
    (intakeParsed && intakeParsed.ok &&
      (typeof intakeParsed.frontmatter["Business"] === "string"
        ? String(intakeParsed.frontmatter["Business"]).trim()
        : "")) || business;

  const packet = renderPacket({
    business,
    businessName,
    asOfDate,
    sourceLedger,
    logisticsRequired,
  });

  if (writeOutput) {
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, packet, "utf8");
  }

  return {
    ok: true,
    outputPath,
    diagnostics,
    sourceLedger,
    packet,
  };
}

type CliOptions = {
  business: string;
  asOfDate?: string;
  repoRoot?: string;
  dryRun: boolean;
  businessProfile?: string[];
};

function parseCliArgs(argv: string[]): CliOptions {
  const options: CliOptions = { business: "", dryRun: false };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--business") {
      options.business = String(argv[i + 1] ?? "");
      i += 1;
      continue;
    }
    if (token === "--as-of") {
      options.asOfDate = String(argv[i + 1] ?? "");
      i += 1;
      continue;
    }
    if (token === "--repo-root") {
      options.repoRoot = String(argv[i + 1] ?? "");
      i += 1;
      continue;
    }
    if (token === "--business-profile") {
      const raw = String(argv[i + 1] ?? "");
      options.businessProfile = raw
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);
      i += 1;
      continue;
    }
    if (token === "--dry-run") {
      options.dryRun = true;
      continue;
    }
  }

  return options;
}

function runCli() {
  const args = parseCliArgs(process.argv.slice(2));
  if (!args.business) {
    console.error(
      "[compile-website-content-packet] Usage: pnpm --filter scripts startup-loop:compile-website-content-packet -- --business <BIZ> [--as-of YYYY-MM-DD] [--business-profile p1,p2] [--dry-run]",
    );
    process.exitCode = 2;
    return;
  }

  const result = compileWebsiteContentPacket({
    business: args.business,
    asOfDate: args.asOfDate,
    repoRoot: args.repoRoot,
    write: !args.dryRun,
    businessProfile: args.businessProfile,
  });

  if (!result.ok) {
    for (const diagnostic of result.diagnostics) {
      console.error(
        `[compile-website-content-packet] ${diagnostic.severity.toUpperCase()} ${diagnostic.code}: ${diagnostic.message}`,
      );
    }
    process.exitCode = 1;
    return;
  }

  const mode = args.dryRun ? "dry-run" : "write";
  console.log(`[compile-website-content-packet] OK (${mode}): ${toPosixRelative(path.resolve(args.repoRoot ?? process.cwd()), result.outputPath)}`);
}

if (process.argv[1]?.includes("compile-website-content-packet")) {
  runCli();
}

