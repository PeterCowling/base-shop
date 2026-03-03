import * as fs from "node:fs";
import * as path from "node:path";

export type LintSeverity = "error" | "warning";

export interface WebsiteContentPacketLintIssue {
  code:
    | "missing_required_section"
    | "missing_matrix_constraints"
    | "forbidden_claim";
  severity: LintSeverity;
  message: string;
  sourcePath: string;
  line?: number;
}

export interface LintWebsiteContentPacketOptions {
  business?: string;
  repoRoot?: string;
  packetPath?: string;
  forbiddenClaims?: string[];
}

export interface LintWebsiteContentPacketResult {
  ok: boolean;
  packetPath: string;
  issues: WebsiteContentPacketLintIssue[];
}

const REQUIRED_SECTION_HEADINGS = [
  "## SEO Focus",
  "### Primary transactional",
  "### Secondary support",
  "## Page Intent Map",
  "## Product Copy Matrix",
] as const;

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&");
}

function normalizeForbiddenClaims(values?: string[]): string[] {
  return (values ?? [])
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
}

function extractProductMatrixRows(content: string): string[] {
  const marker = "## Product Copy Matrix";
  const start = content.indexOf(marker);
  if (start < 0) {
    return [];
  }

  const afterMarker = content.slice(start + marker.length);
  const nextSection = afterMarker.search(/^##\s+/m);
  const block = nextSection >= 0 ? afterMarker.slice(0, nextSection) : afterMarker;

  return block
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.startsWith("|"));
}

function lineContainsForbiddenClaim(line: string, claim: string): boolean {
  const normalized = line.toLowerCase();
  if (!normalized.includes(claim)) {
    return false;
  }

  if (normalized.includes("do not ") || normalized.includes("don't ")) {
    return false;
  }

  if (line.includes("`")) {
    return false;
  }

  return true;
}

export function lintWebsiteContentPacket(
  options: LintWebsiteContentPacketOptions,
): LintWebsiteContentPacketResult {
  const repoRoot = path.resolve(options.repoRoot ?? process.cwd());
  const packetPath =
    options.packetPath ??
    `docs/business-os/startup-baselines/${String(options.business ?? "").trim()}-content-packet.md`;
  const resolvedPath = path.join(repoRoot, packetPath);

  const issues: WebsiteContentPacketLintIssue[] = [];

  if (!fs.existsSync(resolvedPath)) {
    issues.push({
      code: "missing_required_section",
      severity: "error",
      message: `Packet not found: ${packetPath}`,
      sourcePath: packetPath,
    });
    return { ok: false, packetPath, issues };
  }

  const content = fs.readFileSync(resolvedPath, "utf8");

  for (const heading of REQUIRED_SECTION_HEADINGS) {
    const pattern = new RegExp(`^${escapeRegExp(heading)}`, "m");
    if (!pattern.test(content)) {
      issues.push({
        code: "missing_required_section",
        severity: "error",
        message: `Missing required section heading '${heading}'.`,
        sourcePath: packetPath,
      });
    }
  }

  const matrixRows = extractProductMatrixRows(content);
  const matrixDataRows = matrixRows.filter(
    (row) => row.includes("|") && !row.includes("---"),
  );
  const headerRow = matrixDataRows[0] ?? "";

  if (headerRow && !headerRow.toLowerCase().includes("evidence constraints")) {
    issues.push({
      code: "missing_matrix_constraints",
      severity: "error",
      message:
        "Product Copy Matrix must include an 'Evidence constraints' column to keep claims traceable.",
      sourcePath: packetPath,
    });
  }

  const dataRows = matrixDataRows.slice(1);
  for (const row of dataRows) {
    const columns = row
      .split("|")
      .map((value) => value.trim())
      .filter((value) => value.length > 0);
    const evidenceConstraint = columns[4] ?? "";
    if (!evidenceConstraint || evidenceConstraint === "-") {
      issues.push({
        code: "missing_matrix_constraints",
        severity: "error",
        message:
          "Each Product Copy Matrix row must provide an Evidence constraints value.",
        sourcePath: packetPath,
      });
      break;
    }
  }

  const forbiddenClaims = normalizeForbiddenClaims(options.forbiddenClaims);
  const lines = content.split(/\r?\n/);

  for (const claim of forbiddenClaims) {
    for (let i = 0; i < lines.length; i += 1) {
      const line = lines[i];
      if (!lineContainsForbiddenClaim(line, claim)) {
        continue;
      }
      issues.push({
        code: "forbidden_claim",
        severity: "error",
        message: `Forbidden claim detected: '${claim}'. Remove or replace with validated language.`,
        sourcePath: packetPath,
        line: i + 1,
      });
    }
  }

  return {
    ok: !issues.some((issue) => issue.severity === "error"),
    packetPath,
    issues,
  };
}

type CliOptions = {
  business?: string;
  packetPath?: string;
  repoRoot?: string;
  forbiddenClaims?: string[];
};

function parseCliArgs(argv: string[]): CliOptions {
  const options: CliOptions = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--business") {
      options.business = String(argv[i + 1] ?? "").trim();
      i += 1;
      continue;
    }
    if (token === "--packet") {
      options.packetPath = String(argv[i + 1] ?? "").trim();
      i += 1;
      continue;
    }
    if (token === "--repo-root") {
      options.repoRoot = String(argv[i + 1] ?? "").trim();
      i += 1;
      continue;
    }
    if (token === "--forbidden") {
      options.forbiddenClaims = String(argv[i + 1] ?? "")
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);
      i += 1;
      continue;
    }
  }
  return options;
}

function runCli() {
  const args = parseCliArgs(process.argv.slice(2));
  if (!args.business && !args.packetPath) {
    console.error(
      "[lint-website-content-packet] Usage: pnpm --filter scripts startup-loop:lint-website-content-packet -- --business <BIZ> | --packet <path> [--forbidden claim-a,claim-b]",
    );
    process.exitCode = 2;
    return;
  }

  const result = lintWebsiteContentPacket({
    business: args.business,
    packetPath: args.packetPath,
    repoRoot: args.repoRoot,
    forbiddenClaims: args.forbiddenClaims,
  });

  if (!result.ok) {
    for (const issue of result.issues) {
      const line = issue.line ? `:${issue.line}` : "";
      console.error(
        `[lint-website-content-packet] ${issue.severity.toUpperCase()} ${issue.code} ${issue.sourcePath}${line} ${issue.message}`,
      );
    }
    process.exitCode = 1;
    return;
  }

  console.log(`[lint-website-content-packet] OK: ${result.packetPath}`);
}

if (process.argv[1]?.includes("lint-website-content-packet")) {
  runCli();
}
