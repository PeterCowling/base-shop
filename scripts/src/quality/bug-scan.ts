import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { extname, join, normalize, relative, resolve } from "node:path";
import process from "node:process";
import ts from "typescript";

type Severity = "critical" | "warning";

interface RuleMatch {
  ruleId: string;
  severity: Severity;
  message: string;
  suggestion: string;
  file: string;
  line: number;
  column: number;
}

interface FingerprintedMatch extends RuleMatch {
  fingerprint: string;
}

interface CliOptions {
  format: "text" | "json";
  changed: boolean;
  staged: boolean;
  failOn: "critical" | "warning" | "none";
  onlyRules: Set<string>;
  skipRules: Set<string>;
  configPath: string | null;
  baselinePath: string | null;
  writeBaselinePath: string | null;
  ideaArtifactPath: string | null;
  businessScope: string | null;
  listRules: boolean;
  targets: string[];
}

interface BugScanConfig {
  severity_overrides?: Record<string, Severity>;
  skip_rules?: string[];
  only_rules?: string[];
}

interface BaselineEntry {
  fingerprint: string;
  ruleId: string;
  severity: Severity;
  file: string;
  message: string;
}

interface BaselineFile {
  version: 1;
  generated_at: string;
  entries: BaselineEntry[];
}

interface BugScanIdeaArtifact {
  schema_version: "bug-scan-findings.v1";
  generated_at: string;
  scan_scope: {
    changed: boolean;
    staged: boolean;
    targets: string[];
    scanned_files: number;
  };
  finding_count: number;
  critical_count: number;
  warning_count: number;
  business_scope: string | null;
  findings: RuleMatch[];
}

const CODE_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);
const JSON_EXTENSIONS = new Set([".json"]);
const SCANNABLE_EXTENSIONS = new Set([...CODE_EXTENSIONS, ...JSON_EXTENSIONS]);
const IGNORE_SEGMENTS = new Set([
  "node_modules",
  ".git",
  ".next",
  "dist",
  "coverage",
  ".turbo",
]);

const KNOWN_RULE_IDS = [
  "dynamic-command-execution",
  "hardcoded-secret-json",
  "hardcoded-secret-literal",
  "hardcoded-secret-object-property",
  "insecure-http-request-url",
  "json-parse-error",
  "nan-direct-comparison",
  "no-angle-any",
  "no-as-any",
  "no-document-write",
  "no-dom-query-non-null-assertion",
  "no-eval-call",
  "no-new-function",
  "no-string-timer-callback",
  "parseint-missing-radix",
  "private-key-material-in-json",
  "scan-read-error",
  "unsafe-dangerouslysetinnerhtml",
  "unsafe-html-assignment",
] as const;

const DEFAULT_CONFIG_PATH = "tools/bug-scan.config.json";
const DEFAULT_BASELINE_PATH = "tools/bug-scan-baseline.json";

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = {
    format: "text",
    changed: false,
    staged: false,
    failOn: "warning",
    onlyRules: new Set(),
    skipRules: new Set(),
    configPath: null,
    baselinePath: null,
    writeBaselinePath: null,
    ideaArtifactPath: null,
    businessScope: null,
    listRules: false,
    targets: [],
  };

  for (const arg of argv) {
    if (arg === "--changed") {
      options.changed = true;
      continue;
    }
    if (arg === "--staged") {
      options.staged = true;
      continue;
    }
    if (arg.startsWith("--format=")) {
      const value = arg.slice("--format=".length);
      if (value === "text" || value === "json") {
        options.format = value;
      } else {
        throw new Error(`Unsupported format: ${value}`);
      }
      continue;
    }
    if (arg.startsWith("--fail-on=")) {
      const value = arg.slice("--fail-on=".length);
      if (value === "critical" || value === "warning" || value === "none") {
        options.failOn = value;
      } else {
        throw new Error(`Unsupported fail-on level: ${value}`);
      }
      continue;
    }
    if (arg.startsWith("--only-rules=")) {
      const value = arg.slice("--only-rules=".length);
      for (const ruleId of value.split(",").map((item) => item.trim()).filter(Boolean)) {
        options.onlyRules.add(ruleId);
      }
      continue;
    }
    if (arg.startsWith("--config=")) {
      options.configPath = arg.slice("--config=".length);
      continue;
    }
    if (arg.startsWith("--baseline=")) {
      options.baselinePath = arg.slice("--baseline=".length);
      continue;
    }
    if (arg === "--write-baseline") {
      options.writeBaselinePath = DEFAULT_BASELINE_PATH;
      continue;
    }
    if (arg.startsWith("--write-baseline=")) {
      options.writeBaselinePath = arg.slice("--write-baseline=".length);
      continue;
    }
    if (arg.startsWith("--idea-artifact=")) {
      options.ideaArtifactPath = arg.slice("--idea-artifact=".length);
      continue;
    }
    if (arg.startsWith("--business-scope=")) {
      options.businessScope = arg.slice("--business-scope=".length).trim() || null;
      continue;
    }
    if (arg.startsWith("--skip-rules=")) {
      const value = arg.slice("--skip-rules=".length);
      for (const ruleId of value.split(",").map((item) => item.trim()).filter(Boolean)) {
        options.skipRules.add(ruleId);
      }
      continue;
    }
    if (arg === "--list-rules") {
      options.listRules = true;
      continue;
    }
    if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    }
    options.targets.push(arg);
  }

  if (options.staged) {
    options.changed = true;
  }

  if (!options.configPath && existsSync(DEFAULT_CONFIG_PATH)) {
    options.configPath = DEFAULT_CONFIG_PATH;
  }
  if (!options.baselinePath && existsSync(DEFAULT_BASELINE_PATH)) {
    options.baselinePath = DEFAULT_BASELINE_PATH;
  }

  return options;
}

function printHelp(): void {
  const help = [
    "Usage: node --import tsx scripts/src/quality/bug-scan.ts [options] [files|dirs...]",
    "",
    "Options:",
    "  --changed        Scan changed files (staged first, then working tree)",
    "  --staged         Scan only staged files",
    "  --format=text    Human-readable output (default)",
    "  --format=json    JSON output",
    "  --fail-on=LEVEL  Exit behavior: warning (default), critical, none",
    "  --only-rules=CSV Run only specified rule IDs",
    "  --skip-rules=CSV Skip specified rule IDs",
    "  --config=PATH    Load scanner config JSON (severity/rule controls)",
    "  --baseline=PATH  Suppress findings matching baseline fingerprints",
    "  --write-baseline[=PATH]  Write current findings as baseline JSON",
    "  --idea-artifact=PATH  Write findings as startup-loop idea artifact JSON",
    "  --business-scope=CODE  Attach business scope to idea artifact output",
    "  --list-rules     Print known rule IDs and exit",
    "",
    "Scanned extensions: .ts .tsx .js .jsx .mjs .cjs .json",
  ];
  process.stdout.write(`${help.join("\n")}\n`);
}

function runGit(args: string[]): string[] {
  try {
    const out = execFileSync("git", args, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
    return out
      .split(/\r?\n/)
      .map((value) => value.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

function listChangedPaths(stagedOnly: boolean): string[] {
  if (stagedOnly) {
    return runGit(["diff", "--cached", "--name-only", "--diff-filter=ACMRTUXB"]);
  }

  const staged = runGit(["diff", "--cached", "--name-only", "--diff-filter=ACMRTUXB"]);
  if (staged.length > 0) {
    return staged;
  }

  return runGit(["diff", "--name-only", "--diff-filter=ACMRTUXB", "HEAD"]);
}

function shouldIgnorePath(absolutePath: string): boolean {
  const normalized = normalize(absolutePath);
  const segments = normalized.split(/[/\\]+/);
  return segments.some((segment) => IGNORE_SEGMENTS.has(segment));
}

function collectFiles(inputPath: string): string[] {
  const absolutePath = resolve(inputPath);
  if (shouldIgnorePath(absolutePath)) {
    return [];
  }

  let stat;
  try {
    stat = statSync(absolutePath);
  } catch {
    return [];
  }

  if (stat.isFile()) {
    return SCANNABLE_EXTENSIONS.has(extname(absolutePath)) ? [absolutePath] : [];
  }

  if (!stat.isDirectory()) {
    return [];
  }

  const files: string[] = [];
  const queue: string[] = [absolutePath];

  while (queue.length > 0) {
    const current = queue.pop();
    if (!current || shouldIgnorePath(current)) {
      continue;
    }

    const entries = readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      const entryPath = join(current, entry.name);
      if (entry.isDirectory()) {
        if (!shouldIgnorePath(entryPath)) {
          queue.push(entryPath);
        }
        continue;
      }

      if (entry.isFile() && SCANNABLE_EXTENSIONS.has(extname(entryPath))) {
        files.push(entryPath);
      }
    }
  }

  return files;
}

function resolveTargetFiles(options: CliOptions): string[] {
  const rawTargets: string[] = [];

  if (options.targets.length > 0) {
    rawTargets.push(...options.targets);
  } else if (options.changed) {
    rawTargets.push(...listChangedPaths(options.staged));
  } else {
    rawTargets.push("apps", "packages", "scripts/src", ".github/workflows");
  }

  const allFiles = new Set<string>();
  for (const target of rawTargets) {
    for (const file of collectFiles(target)) {
      allFiles.add(file);
    }
  }

  return [...allFiles].sort();
}

function isSuspiciousSecretName(name: string): boolean {
  const compact = name.replace(/[^a-z0-9]/gi, "").toLowerCase();
  if (compact.endsWith("secrets")) {
    return false;
  }

  const markers = [
    "secret",
    "token",
    "password",
    "apikey",
    "privatekey",
    "clientsecret",
    "accesskey",
    "webhooksecret",
  ];

  return markers.some((marker) => compact === marker || compact.endsWith(marker));
}

function isSuspiciousSecretValue(value: string): boolean {
  const trimmed = value.trim();
  if (trimmed.length < 8) {
    return false;
  }

  if (/^(example|test|dummy|changeme|replace|todo|placeholder|your[-_])/i.test(trimmed)) {
    return false;
  }

  if (trimmed.includes("{{") || trimmed.includes("${") || trimmed.startsWith("<")) {
    return false;
  }

  const hasLetters = /[A-Za-z]/.test(trimmed);
  const hasDigits = /\d/.test(trimmed);
  const hasSpecial = /[_\-+/=]/.test(trimmed);

  return (hasLetters && hasDigits) || (hasLetters && hasSpecial) || trimmed.length >= 24;
}

function nodeLocation(source: ts.SourceFile, node: ts.Node): { line: number; column: number } {
  const { line, character } = source.getLineAndCharacterOfPosition(node.getStart(source));
  return { line: line + 1, column: character + 1 };
}

function indexLocation(content: string, index: number): { line: number; column: number } {
  const boundedIndex = Math.max(0, Math.min(index, content.length));
  const prior = content.slice(0, boundedIndex);
  const lines = prior.split(/\r?\n/);
  const line = lines.length;
  const column = (lines.at(-1)?.length ?? 0) + 1;
  return { line, column };
}

function pushMatch(
  results: RuleMatch[],
  source: ts.SourceFile,
  node: ts.Node,
  payload: Omit<RuleMatch, "file" | "line" | "column">,
): void {
  const location = nodeLocation(source, node);
  results.push({
    ...payload,
    file: relative(process.cwd(), source.fileName),
    line: location.line,
    column: location.column,
  });
}

function pushMatchAtIndex(
  results: RuleMatch[],
  filePath: string,
  content: string,
  index: number,
  payload: Omit<RuleMatch, "file" | "line" | "column">,
): void {
  const location = indexLocation(content, index);
  results.push({
    ...payload,
    file: relative(process.cwd(), filePath),
    line: location.line,
    column: location.column,
  });
}

function isStringLikeExpression(node: ts.Expression): boolean {
  return ts.isStringLiteralLike(node) || ts.isNoSubstitutionTemplateLiteral(node);
}

function expressionText(node: ts.Expression, source: ts.SourceFile): string {
  if (ts.isStringLiteralLike(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
    return node.text;
  }
  return node.getText(source);
}

function isExecLikeCallee(expr: ts.Expression): boolean {
  if (ts.isIdentifier(expr)) {
    return ["exec", "execSync", "spawn", "spawnSync"].includes(expr.text);
  }
  return false;
}

function isNaNComparisonOperator(kind: ts.SyntaxKind): boolean {
  return (
    kind === ts.SyntaxKind.EqualsEqualsEqualsToken ||
    kind === ts.SyntaxKind.EqualsEqualsToken ||
    kind === ts.SyntaxKind.ExclamationEqualsEqualsToken ||
    kind === ts.SyntaxKind.ExclamationEqualsToken
  );
}

function scanCodeFile(filePath: string): RuleMatch[] {
  const content = readFileSync(filePath, "utf8");
  const source = ts.createSourceFile(filePath, content, ts.ScriptTarget.Latest, true);
  const matches: RuleMatch[] = [];

  const visit = (node: ts.Node): void => {
    if (ts.isCallExpression(node)) {
      const callee = node.expression;

      if (ts.isIdentifier(callee) && callee.text === "eval") {
        pushMatch(matches, source, node, {
          ruleId: "no-eval-call",
          severity: "critical",
          message: "`eval()` execution is unsafe and hard to audit.",
          suggestion: "Replace with explicit parsing/dispatch logic.",
        });
      }

      if (ts.isPropertyAccessExpression(callee) && callee.name.text === "write") {
        if (ts.isIdentifier(callee.expression) && callee.expression.text === "document") {
          pushMatch(matches, source, node, {
            ruleId: "no-document-write",
            severity: "critical",
            message: "`document.write()` is unsafe and can break rendering/security assumptions.",
            suggestion: "Use DOM-safe rendering methods or server-side templating.",
          });
        }
      }

      if (ts.isIdentifier(callee) && ["setTimeout", "setInterval"].includes(callee.text)) {
        const firstArg = node.arguments[0];
        if (firstArg && isStringLikeExpression(firstArg)) {
          pushMatch(matches, source, node, {
            ruleId: "no-string-timer-callback",
            severity: "warning",
            message: "String-based timer callback behaves like runtime eval.",
            suggestion: "Pass a function callback instead of a string.",
          });
        }
      }

      if (ts.isIdentifier(callee) && callee.text === "parseInt") {
        if (node.arguments.length === 1) {
          pushMatch(matches, source, node, {
            ruleId: "parseint-missing-radix",
            severity: "warning",
            message: "`parseInt` called without explicit radix.",
            suggestion: "Pass radix explicitly, e.g. `parseInt(value, 10)`.",
          });
        }
      }

      if (isExecLikeCallee(callee)) {
        const firstArg = node.arguments[0];
        if (firstArg && !isStringLikeExpression(firstArg)) {
          pushMatch(matches, source, node, {
            ruleId: "dynamic-command-execution",
            severity: "critical",
            message: "Dynamic command execution argument detected.",
            suggestion: "Use allow-listed command templates and strict argument escaping.",
          });
        }
      }

      if (
        (ts.isIdentifier(callee) && callee.text === "fetch") ||
        (ts.isPropertyAccessExpression(callee) && ts.isIdentifier(callee.expression) && callee.expression.text === "axios")
      ) {
        const firstArg = node.arguments[0];
        if (firstArg && isStringLikeExpression(firstArg)) {
          const value = expressionText(firstArg, source);
          if (value.startsWith("http://")) {
            pushMatch(matches, source, node, {
              ruleId: "insecure-http-request-url",
              severity: "warning",
              message: "Request URL uses insecure `http://`.",
              suggestion: "Prefer `https://` unless local/dev-only with explicit justification.",
            });
          }
        }
      }
    }

    if (ts.isNewExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === "Function") {
      pushMatch(matches, source, node, {
        ruleId: "no-new-function",
        severity: "critical",
        message: "`new Function()` creates runtime-evaluated code.",
        suggestion: "Use direct functions or table-driven handlers.",
      });
    }

    if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.EqualsToken) {
      if (ts.isPropertyAccessExpression(node.left) && ["innerHTML", "outerHTML"].includes(node.left.name.text)) {
        const rhsText = node.right.getText(source);
        const appearsSanitized = /(sanitize|escapeHtml|DOMPurify)/.test(rhsText);
        if (!appearsSanitized) {
          pushMatch(matches, source, node, {
            ruleId: "unsafe-html-assignment",
            severity: "critical",
            message: "Direct HTML assignment without clear sanitization.",
            suggestion: "Sanitize input or render with safe text nodes/components.",
          });
        }
      }
    }

    if (ts.isBinaryExpression(node) && isNaNComparisonOperator(node.operatorToken.kind)) {
      const leftIsNaN = ts.isIdentifier(node.left) && node.left.text === "NaN";
      const rightIsNaN = ts.isIdentifier(node.right) && node.right.text === "NaN";
      if (leftIsNaN || rightIsNaN) {
        pushMatch(matches, source, node, {
          ruleId: "nan-direct-comparison",
          severity: "warning",
          message: "Direct comparison with `NaN` is always false/true in unexpected ways.",
          suggestion: "Use `Number.isNaN(value)` for NaN checks.",
        });
      }
    }

    if (ts.isAsExpression(node) && node.type.kind === ts.SyntaxKind.AnyKeyword) {
      pushMatch(matches, source, node, {
        ruleId: "no-as-any",
        severity: "warning",
        message: "`as any` bypasses type safety.",
        suggestion: "Replace with a precise type or narrow unknown safely.",
      });
    }

    if (ts.isTypeAssertionExpression(node) && node.type.kind === ts.SyntaxKind.AnyKeyword) {
      pushMatch(matches, source, node, {
        ruleId: "no-angle-any",
        severity: "warning",
        message: "`<any>` assertion bypasses type safety.",
        suggestion: "Replace with a precise type or runtime guard.",
      });
    }

    if (ts.isNonNullExpression(node) && ts.isCallExpression(node.expression)) {
      const callee = node.expression.expression;
      if (
        ts.isPropertyAccessExpression(callee) &&
        ts.isIdentifier(callee.expression) &&
        callee.expression.text === "document" &&
        ["getElementById", "querySelector", "querySelectorAll"].includes(callee.name.text)
      ) {
        pushMatch(matches, source, node, {
          ruleId: "no-dom-query-non-null-assertion",
          severity: "warning",
          message: "Non-null assertion on DOM query can crash at runtime.",
          suggestion: "Handle null explicitly or early-return with guard.",
        });
      }
    }

    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.initializer) {
      if (isSuspiciousSecretName(node.name.text) && ts.isStringLiteralLike(node.initializer)) {
        const value = node.initializer.text;
        if (isSuspiciousSecretValue(value)) {
          pushMatch(matches, source, node, {
            ruleId: "hardcoded-secret-literal",
            severity: "critical",
            message: "Suspicious hardcoded secret-like string literal.",
            suggestion: "Move secret material to env/secret manager.",
          });
        }
      }
    }

    if (ts.isPropertyAssignment(node)) {
      const keyText = ts.isIdentifier(node.name) || ts.isStringLiteralLike(node.name)
        ? node.name.text
        : node.name.getText(source);
      if (isSuspiciousSecretName(keyText) && ts.isStringLiteralLike(node.initializer)) {
        if (isSuspiciousSecretValue(node.initializer.text)) {
          pushMatch(matches, source, node, {
            ruleId: "hardcoded-secret-object-property",
            severity: "critical",
            message: "Object property contains suspicious hardcoded secret literal.",
            suggestion: "Load secret from environment/secret manager instead of source.",
          });
        }
      }
    }

    if (ts.isJsxAttribute(node) && node.name.getText(source) === "dangerouslySetInnerHTML") {
      const valueText = node.initializer?.getText(source) ?? "";
      const appearsSanitized = /(sanitize|escapeHtml|DOMPurify)/.test(valueText);
      if (!appearsSanitized) {
        pushMatch(matches, source, node, {
          ruleId: "unsafe-dangerouslysetinnerhtml",
          severity: "critical",
          message: "`dangerouslySetInnerHTML` without clear sanitization signal.",
          suggestion: "Sanitize source HTML or avoid raw HTML injection.",
        });
      }
    }

    ts.forEachChild(node, visit);
  };

  visit(source);
  return matches;
}

function scanJsonFile(filePath: string): RuleMatch[] {
  const content = readFileSync(filePath, "utf8");
  const matches: RuleMatch[] = [];

  const privateKeyMatch = /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/.exec(content);
  if (privateKeyMatch?.index != null) {
    pushMatchAtIndex(matches, filePath, content, privateKeyMatch.index, {
      ruleId: "private-key-material-in-json",
      severity: "critical",
      message: "Private key material detected in JSON content.",
      suggestion: "Remove key material from source and load through secure secret storage.",
    });
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    pushMatchAtIndex(matches, filePath, content, 0, {
      ruleId: "json-parse-error",
      severity: "warning",
      message: "Scanner could not parse JSON file.",
      suggestion: "Fix JSON syntax or exclude file from scan scope.",
    });
    return matches;
  }

  const walk = (value: unknown, pathParts: string[]): void => {
    if (Array.isArray(value)) {
      value.forEach((item, index) => {
        walk(item, [...pathParts, String(index)]);
      });
      return;
    }

    if (value && typeof value === "object") {
      for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
        const nextPath = [...pathParts, key];

        if (typeof nested === "string" && isSuspiciousSecretName(key) && isSuspiciousSecretValue(nested)) {
          const token = JSON.stringify(nested);
          const index = content.indexOf(token);
          pushMatchAtIndex(matches, filePath, content, index >= 0 ? index : 0, {
            ruleId: "hardcoded-secret-json",
            severity: "critical",
            message: `Suspicious secret-like JSON value at key path ${nextPath.join(".")}.`,
            suggestion: "Store sensitive values in secret manager/environment and reference at runtime.",
          });
        }

        walk(nested, nextPath);
      }
    }
  };

  walk(parsed, []);
  return matches;
}

function scanFile(filePath: string): RuleMatch[] {
  const extension = extname(filePath).toLowerCase();
  if (CODE_EXTENSIONS.has(extension)) {
    return scanCodeFile(filePath);
  }
  if (JSON_EXTENSIONS.has(extension)) {
    return scanJsonFile(filePath);
  }
  return [];
}

function renderText(matches: RuleMatch[], scannedFiles: number): void {
  const critical = matches.filter((match) => match.severity === "critical").length;
  const warning = matches.filter((match) => match.severity === "warning").length;

  process.stdout.write(`Bug scan complete: ${scannedFiles} files, ${matches.length} findings (${critical} critical, ${warning} warning).\n`);

  if (matches.length === 0) {
    return;
  }

  for (const match of matches) {
    process.stdout.write(
      `${match.severity.toUpperCase()} ${match.ruleId} ${match.file}:${match.line}:${match.column} ${match.message} Fix: ${match.suggestion}\n`,
    );
  }
}

function fingerprintMatch(match: RuleMatch): string {
  const payload = [match.ruleId, match.severity, match.file, match.message].join("|");
  return createHash("sha256").update(payload).digest("hex");
}

function withFingerprints(matches: RuleMatch[]): FingerprintedMatch[] {
  return matches.map((match) => ({
    ...match,
    fingerprint: fingerprintMatch(match),
  }));
}

function loadConfig(path: string | null): BugScanConfig {
  if (!path) {
    return {};
  }

  const raw = readFileSync(path, "utf8");
  const parsed = JSON.parse(raw) as BugScanConfig;
  return parsed;
}

function applyConfigToOptions(options: CliOptions, config: BugScanConfig): void {
  for (const ruleId of config.skip_rules ?? []) {
    options.skipRules.add(ruleId);
  }
  for (const ruleId of config.only_rules ?? []) {
    options.onlyRules.add(ruleId);
  }
}

function applySeverityOverrides(matches: RuleMatch[], config: BugScanConfig): RuleMatch[] {
  const overrides = config.severity_overrides ?? {};
  return matches.map((match) => {
    const override = overrides[match.ruleId];
    if (!override) {
      return match;
    }
    return {
      ...match,
      severity: override,
    };
  });
}

function loadBaselineFingerprints(path: string | null): Set<string> {
  if (!path || !existsSync(path)) {
    return new Set();
  }

  const raw = readFileSync(path, "utf8");
  const parsed = JSON.parse(raw) as Partial<BaselineFile>;
  const entries = Array.isArray(parsed.entries) ? parsed.entries : [];
  return new Set(entries.map((entry) => String(entry.fingerprint)).filter(Boolean));
}

function suppressBaselineMatches(
  matches: FingerprintedMatch[],
  baselineFingerprints: Set<string>,
): { remaining: FingerprintedMatch[]; suppressedCount: number } {
  if (baselineFingerprints.size === 0) {
    return { remaining: matches, suppressedCount: 0 };
  }

  const remaining = matches.filter((match) => !baselineFingerprints.has(match.fingerprint));
  return {
    remaining,
    suppressedCount: matches.length - remaining.length,
  };
}

function writeBaseline(path: string, matches: FingerprintedMatch[]): void {
  const byFingerprint = new Map<string, BaselineEntry>();
  for (const match of matches) {
    if (!byFingerprint.has(match.fingerprint)) {
      byFingerprint.set(match.fingerprint, {
        fingerprint: match.fingerprint,
        ruleId: match.ruleId,
        severity: match.severity,
        file: match.file,
        message: match.message,
      });
    }
  }

  const entries = [...byFingerprint.values()].sort((a, b) => {
    if (a.ruleId !== b.ruleId) {
      return a.ruleId.localeCompare(b.ruleId);
    }
    return a.file.localeCompare(b.file);
  });

  const payload: BaselineFile = {
    version: 1,
    generated_at: new Date().toISOString(),
    entries,
  };

  const abs = resolve(path);
  mkdirSync(resolve(abs, ".."), { recursive: true });
  writeFileSync(abs, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

function writeIdeaArtifact(
  path: string,
  options: CliOptions,
  scannedFiles: number,
  matches: RuleMatch[],
): void {
  const payload: BugScanIdeaArtifact = {
    schema_version: "bug-scan-findings.v1",
    generated_at: new Date().toISOString(),
    scan_scope: {
      changed: options.changed,
      staged: options.staged,
      targets: [...options.targets],
      scanned_files: scannedFiles,
    },
    finding_count: matches.length,
    critical_count: matches.filter((match) => match.severity === "critical").length,
    warning_count: matches.filter((match) => match.severity === "warning").length,
    business_scope: options.businessScope,
    findings: matches,
  };

  const abs = resolve(path);
  mkdirSync(resolve(abs, ".."), { recursive: true });
  writeFileSync(abs, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

function filterMatches(matches: RuleMatch[], options: CliOptions): RuleMatch[] {
  return matches.filter((match) => {
    if (options.onlyRules.size > 0 && !options.onlyRules.has(match.ruleId)) {
      return false;
    }
    if (options.skipRules.has(match.ruleId)) {
      return false;
    }
    return true;
  });
}

function shouldFail(matches: RuleMatch[], failOn: CliOptions["failOn"]): boolean {
  if (failOn === "none") {
    return false;
  }
  if (failOn === "warning") {
    return matches.length > 0;
  }
  return matches.some((match) => match.severity === "critical");
}

function main(): void {
  const options = parseArgs(process.argv.slice(2));
  const config = loadConfig(options.configPath);
  applyConfigToOptions(options, config);

  if (options.listRules) {
    process.stdout.write(`${KNOWN_RULE_IDS.join("\n")}\n`);
    return;
  }

  const files = resolveTargetFiles(options);

  const rawMatches: RuleMatch[] = [];
  for (const file of files) {
    try {
      rawMatches.push(...scanFile(file));
    } catch {
      rawMatches.push({
        ruleId: "scan-read-error",
        severity: "warning",
        message: "Scanner could not parse file.",
        suggestion: "Check file encoding/syntax.",
        file: relative(process.cwd(), file),
        line: 1,
        column: 1,
      });
    }
  }

  const severityTuned = applySeverityOverrides(rawMatches, config);
  const filtered = filterMatches(severityTuned, options);
  const fingered = withFingerprints(filtered);
  const baselineFingerprints = loadBaselineFingerprints(options.baselinePath);
  const { remaining, suppressedCount } = suppressBaselineMatches(fingered, baselineFingerprints);
  const matches = remaining.map(({ fingerprint: _fingerprint, ...match }) => match);

  if (options.writeBaselinePath) {
    writeBaseline(options.writeBaselinePath, fingered);
  }
  if (options.ideaArtifactPath) {
    writeIdeaArtifact(options.ideaArtifactPath, options, files.length, matches);
  }

  if (options.format === "json") {
    process.stdout.write(
      JSON.stringify(
        {
          scanned_files: files.length,
          finding_count: matches.length,
          suppressed_count: suppressedCount,
          critical_count: matches.filter((match) => match.severity === "critical").length,
          warning_count: matches.filter((match) => match.severity === "warning").length,
          baseline_path: options.baselinePath,
          baseline_written_to: options.writeBaselinePath,
          findings: matches,
        },
        null,
        2,
      ) + "\n",
    );
  } else {
    renderText(matches, files.length);
    if (suppressedCount > 0) {
      process.stdout.write(`Suppressed by baseline: ${suppressedCount}\n`);
    }
    if (options.writeBaselinePath) {
      process.stdout.write(`Baseline written: ${options.writeBaselinePath}\n`);
    }
    if (options.ideaArtifactPath) {
      process.stdout.write(`Idea artifact written: ${options.ideaArtifactPath}\n`);
    }
  }

  if (shouldFail(matches, options.failOn)) {
    process.exitCode = 1;
  }
}

main();
