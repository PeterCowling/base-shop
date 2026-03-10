import * as fs from "node:fs";
import * as path from "node:path";

export interface LogisticsPolicyFields {
  dispatchSla: string;
  returnWindowRule: string;
  returnConditionRule: string;
  dutiesTaxPayerRule: string;
  supportResponseSla: string;
}

export interface LogisticsPolicyDiagnostics {
  code:
    | "missing_logistics_pack"
    | "missing_policy_field"
    | "invalid_policy_value";
  message: string;
  sourcePath?: string;
}

export interface LogisticsPolicyBlocks {
  shippingSummary: string;
  shippingBullets: string[];
  returnsSummary: string;
  returnsBullets: string[];
  supportSummary: string;
  supportResponseSla: string;
  sourcePath: string;
}

export interface MapLogisticsPolicyBlocksOptions {
  repoRoot?: string;
  business: string;
  logisticsRequired: boolean;
  logisticsPackPath?: string;
}

export interface MapLogisticsPolicyBlocksResult {
  ok: boolean;
  skipped: boolean;
  diagnostics: LogisticsPolicyDiagnostics[];
  fields?: LogisticsPolicyFields;
  blocks?: LogisticsPolicyBlocks;
}

const FIELD_LABELS: ReadonlyArray<readonly [keyof LogisticsPolicyFields, string]> = [
  ["dispatchSla", "Dispatch SLA"],
  ["returnWindowRule", "Return Window Rule"],
  ["returnConditionRule", "Return Condition Rule"],
  ["dutiesTaxPayerRule", "Duties/Tax Payer Rule"],
  ["supportResponseSla", "Support Response SLA"],
];

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function extractField(body: string, label: string): string | null {
  const pattern = new RegExp(
    `(?:^|\\n)(?:-\\s*)?${label.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&")}\\s*:\\s*(.+)$`,
    "im",
  );
  const match = body.match(pattern);
  if (!match) {
    return null;
  }
  const value = normalizeWhitespace(String(match[1] ?? ""));
  return value || null;
}

export function mapLogisticsPolicyBlocks(
  options: MapLogisticsPolicyBlocksOptions,
): MapLogisticsPolicyBlocksResult {
  const repoRoot = path.resolve(options.repoRoot ?? process.cwd());
  const business = options.business.trim();
  const logisticsPackPath =
    options.logisticsPackPath ??
    `docs/business-os/strategy/${business}/logistics-pack.user.md`;
  const diagnostics: LogisticsPolicyDiagnostics[] = [];

  if (!options.logisticsRequired) {
    return {
      ok: true,
      skipped: true,
      diagnostics,
    };
  }

  const absolutePath = path.join(repoRoot, logisticsPackPath);
  if (!fs.existsSync(absolutePath)) {
    diagnostics.push({
      code: "missing_logistics_pack",
      message:
        "Business profile requires logistics policy mapping, but logistics-pack.user.md is missing.",
      sourcePath: logisticsPackPath,
    });
    return {
      ok: false,
      skipped: false,
      diagnostics,
    };
  }

  const content = fs.readFileSync(absolutePath, "utf8");
  const fieldValues: Partial<LogisticsPolicyFields> = {};

  for (const [key, label] of FIELD_LABELS) {
    const value = extractField(content, label);
    if (!value) {
      diagnostics.push({
        code: "missing_policy_field",
        message: `Missing required logistics policy field '${label}'.`,
        sourcePath: logisticsPackPath,
      });
      continue;
    }
    fieldValues[key] = value;
  }

  if (diagnostics.length > 0) {
    return {
      ok: false,
      skipped: false,
      diagnostics,
    };
  }

  const fields = fieldValues as LogisticsPolicyFields;
  const blocks: LogisticsPolicyBlocks = {
    shippingSummary: `Dispatch policy: ${fields.dispatchSla}`,
    shippingBullets: [
      fields.dispatchSla,
      fields.dutiesTaxPayerRule,
    ],
    returnsSummary: `Returns policy: ${fields.returnWindowRule}`,
    returnsBullets: [
      fields.returnWindowRule,
      fields.returnConditionRule,
    ],
    supportSummary:
      "Support expectations are derived from logistics and fulfillment policy inputs.",
    supportResponseSla: fields.supportResponseSla,
    sourcePath: logisticsPackPath,
  };

  return {
    ok: true,
    skipped: false,
    diagnostics,
    fields,
    blocks,
  };
}
