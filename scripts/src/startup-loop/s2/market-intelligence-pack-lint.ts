/* i18n-exempt file -- startup-loop operator tooling; not end-user UI [ttl=2026-12-31] */
import { promises as fs } from "fs";
import path from "path";

export interface MarketIntelPackLintIssue {
  file: string; // repo-relative
  line: number; // 1-based
  code:
    | "clipboard_artifact_text_copy"
    | "placeholder_site_evidence"
    | "stray_image_caption"
    | "missing_table_evidence_url";
  message: string;
}

function toRepoRelative(absoluteOrRelativePath: string): string {
  const absolute = path.resolve(process.cwd(), absoluteOrRelativePath);
  return path.relative(process.cwd(), absolute).replaceAll("\\", "/");
}

function looksLikeMarkdownTableRow(line: string): boolean {
  const trimmed = line.trim();
  return trimmed.startsWith("|") && trimmed.endsWith("|") && trimmed.includes("|");
}

function splitMarkdownTableRow(line: string): string[] {
  // Drop leading/trailing "|" then split.
  const trimmed = line.trim();
  const body = trimmed.slice(1, -1);
  return body.split("|").map((c) => c.trim());
}

function isAlignmentRow(cells: string[]): boolean {
  return cells.every((cell) => /^:?-{3,}:?$/.test(cell));
}

function containsUrl(text: string): boolean {
  return /\bhttps?:\/\//.test(text);
}

function isOperatorFillContext(recentNonEmptyLines: string[]): boolean {
  return recentNonEmptyLines.some((l) => l.toLowerCase().includes("operator-fill"));
}

export function lintMarketIntelligencePack(args: {
  filePath: string;
  content: string;
}): MarketIntelPackLintIssue[] {
  const rel = toRepoRelative(args.filePath);
  const lines = args.content.split(/\r?\n/);
  const issues: MarketIntelPackLintIssue[] = [];

  const recentNonEmptyLines: string[] = [];

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i] ?? "";
    const trimmed = line.trim();

    if (trimmed) {
      recentNonEmptyLines.push(trimmed);
      if (recentNonEmptyLines.length > 5) recentNonEmptyLines.shift();
    }

    // Clipboard artifact: "text" then "Copy" on next non-empty line.
    if (trimmed === "text") {
      for (let j = i + 1; j < Math.min(lines.length, i + 5); j += 1) {
        const next = (lines[j] ?? "").trim();
        if (!next) continue;
        if (next === "Copy") {
          issues.push({
            file: rel,
            line: i + 1,
            code: "clipboard_artifact_text_copy",
            message: `Found clipboard artifact sequence "text" -> "Copy". Remove these lines.`,
          });
        }
        break;
      }
    }

    if (trimmed.toLowerCase().includes("site evidence")) {
      issues.push({
        file: rel,
        line: i + 1,
        code: "placeholder_site_evidence",
        message: `Found placeholder "site evidence". Replace with an actual URL citation or remove.`,
      });
    }

    // Common stray image-caption fragments that show up in Deep Research output.
    if (/^(Panoramic|Aerial|Coastline|View of|Image of|Photo of)\b/.test(trimmed)) {
      issues.push({
        file: rel,
        line: i + 1,
        code: "stray_image_caption",
        message: `Found likely stray image caption ("${trimmed}"). Remove it unless it's part of deliberate content.`,
      });
    }

    // Evidence URL enforcement for tables with an Evidence column.
    if (!looksLikeMarkdownTableRow(line)) continue;

    const cells = splitMarkdownTableRow(line);
    if (cells.length < 2) continue;

    // Header row detection: contains "Evidence".
    const evidenceColIndex = cells.findIndex((c) => {
      const normalized = c.trim().toLowerCase();
      return normalized === "evidence (url)" || normalized === "evidence url";
    });
    if (evidenceColIndex === -1) continue;

    // Walk subsequent rows until table stops.
    for (let row = i + 1; row < lines.length; row += 1) {
      const rowLine = lines[row] ?? "";
      if (!looksLikeMarkdownTableRow(rowLine)) break;

      const rowCells = splitMarkdownTableRow(rowLine);
      if (rowCells.length <= evidenceColIndex) continue;
      if (isAlignmentRow(rowCells)) continue;

      const evidenceCell = rowCells[evidenceColIndex]?.trim() ?? "";
      const allowPlaceholders = isOperatorFillContext(recentNonEmptyLines);

      if (!evidenceCell) {
        issues.push({
          file: rel,
          line: row + 1,
          code: "missing_table_evidence_url",
          message: `Missing Evidence cell in table row. Add a URL (or mark operator-fill explicitly if intended).`,
        });
        continue;
      }

      if (allowPlaceholders) continue;
      if (!containsUrl(evidenceCell)) {
        issues.push({
          file: rel,
          line: row + 1,
          code: "missing_table_evidence_url",
          message: `Evidence cell does not contain a URL: "${evidenceCell}". Add at least one https:// citation per row.`,
        });
      }
    }
  }

  return issues;
}

function parseCliArgs(argv: string[]): { paths: string[] } {
  const ddIndex = argv.indexOf("--");
  const rawPaths = (ddIndex === -1 ? argv.slice(2) : argv.slice(ddIndex + 1)).filter(Boolean);
  return { paths: rawPaths };
}

async function main() {
  const { paths } = parseCliArgs(process.argv);
  if (paths.length === 0) {
    console.error(
      `[market-intelligence-pack-lint] Usage: pnpm startup-loop:lint-market-intel-pack -- <path/to/pack.user.md> [more...]`,
    );
    process.exitCode = 2;
    return;
  }

  const allIssues: MarketIntelPackLintIssue[] = [];
  for (const p of paths) {
    const absolute = path.resolve(process.cwd(), p);
    const content = await fs.readFile(absolute, "utf8");
    allIssues.push(...lintMarketIntelligencePack({ filePath: absolute, content }));
  }

  if (allIssues.length === 0) {
    console.log(`[market-intelligence-pack-lint] OK`);
    return;
  }

  for (const issue of allIssues) {
    console.error(`[market-intelligence-pack-lint] ${issue.file}:${issue.line} ${issue.code} ${issue.message}`);
  }
  process.exitCode = 1;
}

if (process.argv[1]?.includes("market-intelligence-pack-lint")) {
  main().catch((err) => {
    console.error(`[market-intelligence-pack-lint] fatal`, err);
    process.exitCode = 1;
  });
}
