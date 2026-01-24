import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

type Violation = {
  filePath: string;
  line: number;
  column: number;
  messageId?: string | null;
  message: string;
};

type Baseline = {
  ruleId: string;
  generatedAt: string;
  violations: Violation[];
};

const RULE_ID = "ds/no-raw-tailwind-color";
const ROOT = process.cwd();

function normalizePath(p: string) {
  return p.split(path.sep).join("/");
}

function readJson(p: string) {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function getArg(name: string) {
  const idx = process.argv.indexOf(name);
  if (idx === -1) return null;
  return process.argv[idx + 1] || null;
}

function hasFlag(name: string) {
  return process.argv.includes(name);
}

function collectViolations(reportPath: string): Violation[] {
  if (!fs.existsSync(reportPath)) {
    throw new Error(`Missing ${reportPath}. Run: pnpm run lint:json`);
  }
  const report = readJson(reportPath) as Array<{
    filePath: string;
    messages: Array<{ ruleId?: string; messageId?: string; message: string; line?: number; column?: number }>;
  }>;

  const violations: Violation[] = [];
  for (const entry of report) {
    if (!entry?.messages?.length) continue;
    for (const msg of entry.messages) {
      if (msg.ruleId !== RULE_ID) continue;
      const filePath = path.isAbsolute(entry.filePath)
        ? normalizePath(path.relative(ROOT, entry.filePath))
        : normalizePath(entry.filePath);
      violations.push({
        filePath,
        line: msg.line ?? 0,
        column: msg.column ?? 0,
        messageId: msg.messageId ?? null,
        message: msg.message,
      });
    }
  }
  return violations.sort((a, b) =>
    `${a.filePath}:${a.line}:${a.column}:${a.message}`.localeCompare(
      `${b.filePath}:${b.line}:${b.column}:${b.message}`
    )
  );
}

function loadBaseline(baselinePath: string): Baseline {
  if (!fs.existsSync(baselinePath)) {
    throw new Error(`Missing baseline ${baselinePath}. Generate with --write-baseline.`);
  }
  const data = readJson(baselinePath) as Baseline;
  return data;
}

function getBaseRef() {
  const explicit = getArg("--base");
  if (explicit) return explicit;
  const envBase = process.env.LINT_BASE_REF;
  if (envBase) return envBase;
  const ghBase = process.env.GITHUB_BASE_REF;
  if (ghBase) return `origin/${ghBase}`;
  const defaults = ["origin/main", "origin/master", "main", "master"];
  for (const ref of defaults) {
    try {
      execSync(`git show-ref --verify --quiet refs/remotes/${ref.replace(/^origin\//, "")}`);
      return ref;
    } catch {
      // ignore
    }
  }
  return "HEAD~1";
}

function getChangedFiles(baseRef: string) {
  try {
    const output = execSync(`git diff --name-only --diff-filter=ACMR ${baseRef}...HEAD`, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
    if (!output) return new Set<string>();
    return new Set(output.split("\n").map((p) => normalizePath(p.trim())).filter(Boolean));
  } catch {
    return new Set<string>();
  }
}

function keyFor(v: Violation) {
  return `${v.filePath}:${v.line}:${v.column}:${v.messageId ?? ""}:${v.message}`;
}

function main() {
  const reportPath = path.resolve(ROOT, getArg("--report") ?? ".eslint-report.json");
  const baselinePath = path.resolve(
    ROOT,
    getArg("--baseline") ?? "tools/eslint-baselines/ds-no-raw-tailwind-color.json"
  );
  const writeBaseline = hasFlag("--write-baseline");

  const violations = collectViolations(reportPath);

  if (writeBaseline) {
    const baseline: Baseline = {
      ruleId: RULE_ID,
      generatedAt: new Date().toISOString(),
      violations,
    };
    fs.mkdirSync(path.dirname(baselinePath), { recursive: true });
    fs.writeFileSync(baselinePath, JSON.stringify(baseline, null, 2) + "\n", "utf8");
    console.log(`[lint-baseline] Wrote ${violations.length} entries to ${baselinePath}`);
    return;
  }

  const baseline = loadBaseline(baselinePath);
  const baselineKeys = new Set(baseline.violations.map(keyFor));
  const baseRef = getBaseRef();
  const changedFiles = getChangedFiles(baseRef);

  const newViolations = violations.filter((v) => !baselineKeys.has(keyFor(v)));
  const changedFileViolations = newViolations.filter((v) => changedFiles.has(v.filePath));

  if (newViolations.length === 0) {
    console.log(`[lint-baseline] No new ${RULE_ID} violations.`);
    return;
  }

  console.error(`[lint-baseline] Found ${newViolations.length} new ${RULE_ID} violation(s).`);

  if (changedFileViolations.length > 0) {
    console.error(`[lint-baseline] ${changedFileViolations.length} violation(s) are in changed files vs ${baseRef}.`);
  }

  for (const v of newViolations.slice(0, 50)) {
    console.error(`- ${v.filePath}:${v.line}:${v.column} ${v.message}`);
  }
  if (newViolations.length > 50) {
    console.error(`... ${newViolations.length - 50} more`);
  }
  process.exit(1);
}

main();
