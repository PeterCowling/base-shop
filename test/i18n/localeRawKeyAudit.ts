import fs from "node:fs";
import path from "node:path";

export type RawKeyAuditIssueKind =
  | "parseError"
  | "placeholderKey"
  | "rawKeyToken";

export type RawKeyAuditIssue = {
  locale: string;
  file: string;
  keyPath: string;
  kind: RawKeyAuditIssueKind;
  value: string;
  token?: string;
};

export type RawKeyAuditOptions = {
  localesRoot: string;
  baselineLocale: string;
  locales: readonly string[];
  skipFilePrefixes?: readonly string[];
};

type JsonWalkCb = (entry: { keyPath: string; value: string }) => void;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function listJsonFiles(rootDir: string, relativeDir = ""): string[] {
  const fullDir = path.join(rootDir, relativeDir);
  const out: string[] = [];
  for (const entry of fs.readdirSync(fullDir, { withFileTypes: true })) {
    const nextRelative = relativeDir ? path.join(relativeDir, entry.name) : entry.name;
    if (entry.isDirectory()) {
      out.push(...listJsonFiles(rootDir, nextRelative));
      continue;
    }
    if (entry.isFile() && entry.name.endsWith(".json")) {
      out.push(nextRelative);
    }
  }
  return out.sort();
}

function walkJsonStrings(value: unknown, cb: JsonWalkCb, keyPath = ""): void {
  if (typeof value === "string") {
    cb({ keyPath, value });
    return;
  }

  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      const nextPath = keyPath ? `${keyPath}.${i}` : String(i);
      walkJsonStrings(value[i], cb, nextPath);
    }
    return;
  }

  if (isRecord(value)) {
    for (const [k, v] of Object.entries(value)) {
      const nextPath = keyPath ? `${keyPath}.${k}` : k;
      walkJsonStrings(v, cb, nextPath);
    }
  }
}

function collectLeafKeyPaths(value: unknown): Set<string> {
  const set = new Set<string>();
  walkJsonStrings(value, ({ keyPath }) => {
    if (keyPath) set.add(keyPath);
  });
  return set;
}

const DOT_TOKEN_PATTERN =
  /\b[a-zA-Z_][a-zA-Z0-9_-]*(?:\.[a-zA-Z_][a-zA-Z0-9_-]*)+\b/g;
const NS_TOKEN_PATTERN =
  /\b[a-zA-Z_][a-zA-Z0-9_-]*:[a-zA-Z_][a-zA-Z0-9_-]*(?:\.[a-zA-Z_][a-zA-Z0-9_-]*)+\b/g;

function isLikelyUrlOrPathToken(token: string): boolean {
  const t = token.trim();
  if (!t) return true;
  // Common false positives when scanning natural language.
  if (/^https?:\/\//iu.test(t)) return true;
  if (/^www\./iu.test(t)) return true;
  if (/^[./\\]/u.test(t)) return true;
  if (/@/u.test(t)) return true;
  // Semantic versions / decimal numbers.
  if (/^\d+\.\d+(?:\.\d+)?$/u.test(t)) return true;
  // Dotted domains (but allow "content.foo.bar" style)
  if (/^[a-z0-9-]+\.[a-z0-9-]+$/iu.test(t)) return true;
  return false;
}

function tokenizePotentialKeyTokens(text: string): string[] {
  const out = new Set<string>();
  for (const m of text.matchAll(DOT_TOKEN_PATTERN)) {
    const token = m[0];
    if (!isLikelyUrlOrPathToken(token)) out.add(token);
  }
  for (const m of text.matchAll(NS_TOKEN_PATTERN)) {
    const token = m[0];
    if (!isLikelyUrlOrPathToken(token)) out.add(token);
  }
  return Array.from(out);
}

function shouldSkipFile(relFile: string, skipPrefixes: readonly string[] | undefined): boolean {
  if (!skipPrefixes || skipPrefixes.length === 0) return false;
  return skipPrefixes.some((prefix) => relFile.startsWith(prefix));
}

export function auditLocaleJsonForRawKeys(options: RawKeyAuditOptions): RawKeyAuditIssue[] {
  const { localesRoot, baselineLocale, locales, skipFilePrefixes } = options;

  const baselineDir = path.join(localesRoot, baselineLocale);
  const baselineFiles = listJsonFiles(baselineDir).filter(
    (file) => !shouldSkipFile(file, skipFilePrefixes),
  );

  const knownKeyPaths = new Set<string>();
  for (const relFile of baselineFiles) {
    const raw = fs.readFileSync(path.join(baselineDir, relFile), "utf8");
    const json = JSON.parse(raw) as unknown;
    for (const keyPath of collectLeafKeyPaths(json)) knownKeyPaths.add(keyPath);
  }

  const issues: RawKeyAuditIssue[] = [];

  for (const locale of locales) {
    const localeDir = path.join(localesRoot, locale);
    if (!fs.existsSync(localeDir)) continue;

    for (const relFile of listJsonFiles(localeDir).filter((f) => !shouldSkipFile(f, skipFilePrefixes))) {
      const filePath = path.join(localeDir, relFile);
      let json: unknown;
      try {
        json = JSON.parse(fs.readFileSync(filePath, "utf8")) as unknown;
      } catch (err) {
        issues.push({
          locale,
          file: relFile,
          keyPath: "",
          kind: "parseError",
          value: String(err),
        });
        continue;
      }

      walkJsonStrings(json, ({ keyPath, value }) => {
        const trimmed = value.trim();
        if (!trimmed) return;

        // The most reliable missing-translation symptom in locale JSON: key-as-value.
        if (trimmed === keyPath) {
          issues.push({
            locale,
            file: relFile,
            keyPath,
            kind: "placeholderKey",
            value: trimmed,
          });
          return;
        }

        // More general: raw key tokens embedded in otherwise-natural text.
        for (const token of tokenizePotentialKeyTokens(trimmed)) {
          const tokenKeyPath = token.includes(":") ? token.split(":").slice(1).join(":") : token;
          if (!knownKeyPaths.has(tokenKeyPath)) continue;
          issues.push({
            locale,
            file: relFile,
            keyPath,
            kind: "rawKeyToken",
            value: trimmed,
            token,
          });
        }
      });
    }
  }

  return issues;
}

export function formatRawKeyAuditIssues(issues: RawKeyAuditIssue[], maxItems = 40): string {
  if (issues.length === 0) return "No raw i18n key issues detected.";
  const lines: string[] = [];
  lines.push(`Raw i18n key issues: ${issues.length}`);
  lines.push("");
  for (const issue of issues.slice(0, maxItems)) {
    const token = issue.token ? ` token=${JSON.stringify(issue.token)}` : "";
    lines.push(
      `${issue.locale} :: ${issue.file} :: ${issue.keyPath} :: ${issue.kind}${token} :: ${JSON.stringify(
        issue.value.length > 180 ? issue.value.slice(0, 177) + "..." : issue.value,
      )}`,
    );
  }
  if (issues.length > maxItems) lines.push(`\n... and ${issues.length - maxItems} more`);
  return lines.join("\n");
}
