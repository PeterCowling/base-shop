import * as crypto from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";

import { parseFrontmatterMarkdown } from "../hypothesis-portfolio/markdown";

import {
  type LogisticsPolicyBlocks,
  mapLogisticsPolicyBlocks,
} from "./map-logistics-policy-blocks";

export type LocaleKey = "en" | "de" | "it";

export type LocalizedText = Partial<Record<LocaleKey, string>> & { en: string };

export interface SiteContentPayload {
  generatedAt: string;
  sourcePacketPath: string;
  sourceHash: string;
  sourcePaths: string[];
  seoKeywords: string[];
  home: {
    eyebrow: LocalizedText;
    heading: LocalizedText;
    summary: LocalizedText;
    ctaPrimary: LocalizedText;
    ctaSecondary: LocalizedText;
    seoHeading: LocalizedText;
    seoBody: LocalizedText;
    faqHeading: LocalizedText;
    faqItems: Array<{
      question: LocalizedText;
      answer: LocalizedText;
    }>;
  };
  shop: {
    eyebrow: LocalizedText;
    heading: LocalizedText;
    summary: LocalizedText;
    trustBullets: LocalizedText[];
  };
  launchFamilies: Record<
    "top-handle" | "shoulder" | "mini",
    { label: LocalizedText; description: LocalizedText }
  >;
  productPage: {
    proofHeading: LocalizedText;
    proofBullets: LocalizedText[];
    relatedHeading: LocalizedText;
  };
  support: {
    title: LocalizedText;
    summary: LocalizedText;
    channels: LocalizedText[];
    responseSla: LocalizedText;
  };
  policies: Record<
    "privacy" | "shipping" | "returns" | "terms",
    {
      title: LocalizedText;
      summary: LocalizedText;
      bullets: LocalizedText[];
      notice?: LocalizedText;
    }
  >;
}

export interface MaterializeSiteContentPayloadOptions {
  business: string;
  shop: string;
  repoRoot?: string;
  sourcePacketPath?: string;
  outputPath?: string;
  write?: boolean;
  asOfDate?: string;
  logisticsPackPath?: string;
}

export interface MaterializeSiteContentPayloadResult {
  ok: boolean;
  outputPath: string;
  payload?: SiteContentPayload;
  diagnostics: string[];
}

function nowIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&");
}

function extractBulletList(markdown: string, heading: string): string[] {
  const headingPattern = new RegExp(`^###\\s+${escapeRegExp(heading)}\\s*$`, "m");
  const startMatch = markdown.match(headingPattern);
  if (!startMatch || startMatch.index == null) {
    return [];
  }

  const startIndex = startMatch.index + startMatch[0].length;
  const rest = markdown.slice(startIndex);
  // Stop at the next heading of any level (h2 or h3) to avoid spilling into subsequent sections.
  const nextHeadingIndex = rest.search(/^#{2,}\s+/m);
  const block = nextHeadingIndex >= 0 ? rest.slice(0, nextHeadingIndex) : rest;

  return block
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.startsWith("- "))
    .map((line) => line.slice(2).trim())
    .filter(Boolean);
}

function extractSourcePaths(body: string): string[] {
  const rows = body
    .split(/\r?\n/)
    .filter((line) => line.trim().startsWith("|"));
  const sourcePaths = new Set<string>();

  for (const row of rows) {
    const pathMatches = row.match(/`(docs\/[^`]+)`/g);
    if (!pathMatches) {
      continue;
    }

    for (const match of pathMatches) {
      sourcePaths.add(match.slice(1, -1));
    }
  }

  return [...sourcePaths].sort((a, b) => a.localeCompare(b));
}

function extractSeoKeywords(body: string): string[] {
  const primary = extractBulletList(body, "Primary transactional clusters");
  const secondary = extractBulletList(body, "Secondary support clusters");

  if (primary.length + secondary.length >= 3) {
    return [...primary, ...secondary];
  }

  return [
    "mini bag charm",
    "handbag charm",
    "micro bag accessory",
    "Italian designed bag accessory",
    "structured bag charm",
  ];
}

function en(value: string): LocalizedText {
  return { en: value };
}

function detectLogisticsRequirement(packetContent: string): boolean {
  return (
    packetContent.includes("## Logistics Policy Inputs") ||
    packetContent.includes("/logistics-pack.user.md") ||
    packetContent.includes("logistics-pack.user.md")
  );
}

function extractBusinessName(packetContent: string, fallback: string): string {
  const parsed = parseFrontmatterMarkdown(packetContent);
  if (parsed.ok && typeof parsed.frontmatter["Business-Name"] === "string") {
    const value = String(parsed.frontmatter["Business-Name"]).trim();
    if (value) {
      return value;
    }
  }

  const frontmatterMatch = packetContent.match(
    /^---\n([\s\S]*?)\n---\n?/,
  );
  if (!frontmatterMatch) {
    return fallback;
  }

  const rawFrontmatter = frontmatterMatch[1];
  const businessNameMatch = rawFrontmatter.match(
    /^Business-Name:\s*(.+)$/m,
  );
  if (!businessNameMatch) {
    return fallback;
  }

  return businessNameMatch[1].trim() || fallback;
}

function buildPayload(args: {
  business: string;
  shop: string;
  sourcePacketPath: string;
  packetContent: string;
  asOfDate: string;
  logisticsPolicy: LogisticsPolicyBlocks | null;
}): SiteContentPayload {
  const businessName = extractBusinessName(args.packetContent, args.shop);

  const sourceHash = crypto
    .createHash("sha256")
    .update(args.packetContent, "utf8")
    .digest("hex");
  const sourcePaths = extractSourcePaths(args.packetContent);
  if (args.logisticsPolicy && !sourcePaths.includes(args.logisticsPolicy.sourcePath)) {
    sourcePaths.push(args.logisticsPolicy.sourcePath);
    sourcePaths.sort((a, b) => a.localeCompare(b));
  }

  const seoKeywords = extractSeoKeywords(args.packetContent);
  const logisticsPolicy = args.logisticsPolicy;

  return {
    generatedAt: args.asOfDate,
    sourcePacketPath: args.sourcePacketPath,
    sourceHash,
    sourcePaths,
    seoKeywords,
    home: {
      eyebrow: en(`Designed for ${businessName}.`),
      heading: en(`Shop ${businessName} launch products.`),
      summary: en(
        `This storefront is generated from the ${args.business} website content packet.`,
      ),
      ctaPrimary: en("Shop the launch"),
      ctaSecondary: en("Explore product details"),
      seoHeading: en("Why this launch offer is clear"),
      seoBody: en(
        "Copy and metadata are generated from startup-loop artifacts and remain source-traceable.",
      ),
      faqHeading: en("Common questions"),
      faqItems: [
        {
          question: en("What is this store?"),
          answer: en(
            `${businessName} launch storefront generated from website content packet artifacts.`,
          ),
        },
        {
          question: en("How is copy maintained?"),
          answer: en(
            "Packet compiler and materializer regenerate copy from canonical startup-loop sources.",
          ),
        },
      ],
    },
    shop: {
      eyebrow: en("Launch collection"),
      heading: en(`Shop ${businessName}`),
      summary: en(
        "Compare launch variants with source-traceable claims and policy-safe copy.",
      ),
      trustBullets: [
        en("Source-traceable copy generated from startup-loop artifacts."),
        en("SEO baseline generated from packet keyword clusters."),
        en("Policy copy stays aligned with support and logistics inputs."),
      ],
    },
    launchFamilies: {
      "top-handle": {
        label: en("Top Handle"),
        description: en("Launch family description generated by materializer."),
      },
      shoulder: {
        label: en("Shoulder"),
        description: en("Launch family description generated by materializer."),
      },
      mini: {
        label: en("Mini"),
        description: en("Launch family description generated by materializer."),
      },
    },
    productPage: {
      proofHeading: en("Product proof points"),
      // Extracted from the `### Product Proof Bullets` section of the content packet.
      // Fail-closed: materializeSiteContentPayload returns ok:false if this list is empty.
      proofBullets: extractBulletList(
        args.packetContent,
        "Product Proof Bullets",
      ).map((line) => en(line)),
      relatedHeading: en("You may also like"),
    },
    support: {
      title: en("Support"),
      summary: en(
        logisticsPolicy?.supportSummary ??
          "Support and policy responses are generated from packet-aligned content blocks.",
      ),
      channels: [
        en("Website support: use order context for faster handling."),
        en("Marketplace support: use channel-native message threads."),
      ],
      responseSla: en(
        logisticsPolicy?.supportResponseSla ??
          "Target response time: within 4 hours during active launch hours.",
      ),
    },
    policies: {
      privacy: {
        title: en("Privacy"),
        summary: en(
          "Order and contact data are used for fulfillment and support operations.",
        ),
        bullets: [
          en("Only required checkout and fulfillment data are collected."),
          en(
            "Platform providers process payment and delivery data under their legal terms.",
          ),
        ],
        notice: en(
          "Launch policy summary. Full legal packet versioning follows later cycles.",
        ),
      },
      shipping: {
        title: en("Shipping"),
        summary: en(
          logisticsPolicy?.shippingSummary ??
            "Shipping windows and tracking availability depend on destination and fulfillment mode.",
        ),
        bullets: logisticsPolicy
          ? logisticsPolicy.shippingBullets.map((line) => en(line))
          : [
              en("Delivery windows are shown at checkout."),
              en(
                "International customs duties remain buyer-responsible unless explicitly stated otherwise.",
              ),
            ],
      },
      returns: {
        title: en("Returns & Exchanges"),
        summary: en(
          logisticsPolicy?.returnsSummary ??
            "Launch orders include exchange-first handling and hardware support coverage.",
        ),
        bullets: logisticsPolicy
          ? logisticsPolicy.returnsBullets.map((line) => en(line))
          : [
              en("Request exchange with order reference and product colorway."),
              en(
                "Return items should include original accessories where applicable.",
              ),
            ],
      },
      terms: {
        title: en("Terms"),
        summary: en(
          "Order placement confirms acceptance of launch sales terms and support policies.",
        ),
        bullets: [
          en(
            "Availability and fulfillment windows depend on inventory and operations capacity.",
          ),
          en("Product photos and descriptions represent listed launch variants."),
        ],
      },
    },
  };
}

export function materializeSiteContentPayload(
  options: MaterializeSiteContentPayloadOptions,
): MaterializeSiteContentPayloadResult {
  const repoRoot = path.resolve(options.repoRoot ?? process.cwd());
  const business = options.business.trim();
  const shop = options.shop.trim();
  const sourcePacketPath =
    options.sourcePacketPath ??
    `docs/business-os/startup-baselines/${business}-content-packet.md`;
  const outputPath =
    options.outputPath ?? `data/shops/${shop}/site-content.generated.json`;
  const resolvedSourcePath = path.join(repoRoot, sourcePacketPath);
  const resolvedOutputPath = path.join(repoRoot, outputPath);
  const write = options.write ?? true;
  const asOfDate = options.asOfDate ?? nowIsoDate();
  const diagnostics: string[] = [];

  if (!fs.existsSync(resolvedSourcePath)) {
    diagnostics.push(`Missing source packet: ${sourcePacketPath}`);
    return { ok: false, outputPath: resolvedOutputPath, diagnostics };
  }

  const packetContent = fs.readFileSync(resolvedSourcePath, "utf8");
  const logisticsRequired = detectLogisticsRequirement(packetContent);
  const logisticsResult = mapLogisticsPolicyBlocks({
    repoRoot,
    business,
    logisticsRequired,
    logisticsPackPath: options.logisticsPackPath,
  });

  if (!logisticsResult.ok) {
    diagnostics.push(
      ...logisticsResult.diagnostics.map(
        (issue) =>
          `${issue.code}: ${issue.message}${
            issue.sourcePath ? ` (${issue.sourcePath})` : ""
          }`,
      ),
    );
    return {
      ok: false,
      outputPath: resolvedOutputPath,
      diagnostics,
    };
  }

  const payload = buildPayload({
    business,
    shop,
    sourcePacketPath,
    packetContent,
    asOfDate,
    logisticsPolicy: logisticsResult.blocks ?? null,
  });

  // Fail-closed: the content packet must have a `### Product Proof Bullets` section
  // with at least one bullet line. An empty list means the section is missing or has
  // no `- ` lines — either case is a content error that must not produce output.
  if (payload.productPage.proofBullets.length === 0) {
    diagnostics.push(
      "Missing required ## Product Proof Bullets section in content packet (or section has no bullet lines). " +
        "Add a `### Product Proof Bullets` h3 section with at least one `- ` bullet to the content packet.",
    );
    return { ok: false, outputPath: resolvedOutputPath, diagnostics };
  }

  if (write) {
    fs.mkdirSync(path.dirname(resolvedOutputPath), { recursive: true });
    fs.writeFileSync(
      resolvedOutputPath,
      `${JSON.stringify(payload, null, 2)}\n`,
      "utf8",
    );
  }

  return {
    ok: true,
    outputPath: resolvedOutputPath,
    payload,
    diagnostics,
  };
}

type CliOptions = {
  business: string;
  shop: string;
  sourcePacketPath?: string;
  outputPath?: string;
  asOfDate?: string;
  logisticsPackPath?: string;
  dryRun: boolean;
};

function parseCliArgs(argv: string[]): CliOptions {
  const options: CliOptions = { business: "", shop: "", dryRun: false };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--business") {
      options.business = String(argv[i + 1] ?? "");
      i += 1;
      continue;
    }
    if (token === "--shop") {
      options.shop = String(argv[i + 1] ?? "");
      i += 1;
      continue;
    }
    if (token === "--source") {
      options.sourcePacketPath = String(argv[i + 1] ?? "");
      i += 1;
      continue;
    }
    if (token === "--output") {
      options.outputPath = String(argv[i + 1] ?? "");
      i += 1;
      continue;
    }
    if (token === "--as-of") {
      options.asOfDate = String(argv[i + 1] ?? "");
      i += 1;
      continue;
    }
    if (token === "--logistics-pack") {
      options.logisticsPackPath = String(argv[i + 1] ?? "");
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
  if (!args.business || !args.shop) {
    console.error(
      "[materialize-site-content-payload] Usage: pnpm --filter scripts startup-loop:materialize-site-content-payload -- --business <BIZ> --shop <shop-id> [--source <path>] [--output <path>] [--logistics-pack <path>] [--as-of YYYY-MM-DD] [--dry-run]",
    );
    process.exitCode = 2;
    return;
  }

  const result = materializeSiteContentPayload({
    business: args.business,
    shop: args.shop,
    sourcePacketPath: args.sourcePacketPath,
    outputPath: args.outputPath,
    asOfDate: args.asOfDate,
    logisticsPackPath: args.logisticsPackPath,
    write: !args.dryRun,
  });

  if (!result.ok) {
    for (const diagnostic of result.diagnostics) {
      console.error(`[materialize-site-content-payload] ERROR: ${diagnostic}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log(
    `[materialize-site-content-payload] OK (${args.dryRun ? "dry-run" : "write"}): ${result.outputPath}`,
  );
}

if (process.argv[1]?.includes("materialize-site-content-payload")) {
  runCli();
}
