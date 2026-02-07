/* eslint-disable security/detect-non-literal-fs-filename -- TEST-1001: Script reads repo-local locale JSON files. [ttl=2026-12-31] */
import fs from "node:fs";
import path from "node:path";

type StringEntry = { file: string; key: string; value: string };
type Violation = StringEntry & { issue: string };

const LOCALES_DIR = path.join(process.cwd(), "src", "locales");
const MAX_SAMPLE_LENGTH = 160;

const DISALLOWED_PATTERNS: Array<{ pattern: RegExp; issue: string }> = [
  {
    pattern: /\bListof\b/gi,
    issue: 'Missing space between "List" and "of".',
  },
  {
    pattern: /\bofTravel\b/gi,
    issue: 'Missing space between "of" and "Travel".',
  },
  {
    pattern: /\bTravelDirections\b/gi,
    issue: 'Missing space between "Travel" and "Directions".',
  },
];

const isUrlLike = (value: string): boolean => {
  const normalized = value.trim();
  return (
    /^https?:\/\/\S+/i.test(normalized) ||
    normalized.startsWith("www.") ||
    normalized.startsWith("/") ||
    /\.(png|jpe?g|webp|svg|gif)(\?|$)/i.test(normalized)
  );
};

const collectStrings = (node: unknown, prefix: string, entries: StringEntry[], file: string): void => {
  if (typeof node === "string") {
    entries.push({ file, key: prefix || "root", value: node });
    return;
  }

  if (Array.isArray(node)) {
    node.forEach((item, index) => collectStrings(item, `${prefix}[${index}]`, entries, file));
    return;
  }

  if (node && typeof node === "object") {
    for (const [key, value] of Object.entries(node)) {
      const nextPrefix = prefix ? `${prefix}.${key}` : key;
      collectStrings(value, nextPrefix, entries, file);
    }
  }
};

const listJsonFiles = (dir: string): string[] => {
  const entries: string[] = [];
  for (const item of fs.readdirSync(dir)) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      entries.push(...listJsonFiles(fullPath));
    } else if (item.endsWith(".json")) {
      entries.push(fullPath);
    }
  }
  return entries;
};

const formatSample = (value: string): string => {
  const trimmed = value.trim();
  if (trimmed.length <= MAX_SAMPLE_LENGTH) return trimmed;
  return `${trimmed.slice(0, MAX_SAMPLE_LENGTH - 3)}...`;
};

const run = (): void => {
  if (!fs.existsSync(LOCALES_DIR)) {
    throw new Error(`Locales directory not found: ${LOCALES_DIR}`);
  }

  const jsonFiles = listJsonFiles(LOCALES_DIR);
  const violations: Violation[] = [];

  for (const file of jsonFiles) {
    const raw = fs.readFileSync(file, "utf8");
    const data = JSON.parse(raw) as unknown;
    const entries: StringEntry[] = [];
    collectStrings(data, "", entries, file);

    for (const entry of entries) {
      if (isUrlLike(entry.value)) continue;
      for (const rule of DISALLOWED_PATTERNS) {
        if (rule.pattern.test(entry.value)) {
          violations.push({ ...entry, issue: rule.issue });
        }
        rule.pattern.lastIndex = 0;
      }
    }
  }

  if (violations.length === 0) {
    console.log("Travel direction spacing checks passed.");
    return;
  }

  const formatted = violations
    .slice(0, 50)
    .map((v) => {
      const relative = path.relative(LOCALES_DIR, v.file);
      return `- ${relative} :: ${v.key} :: ${v.issue} :: ${JSON.stringify(formatSample(v.value))}`;
    })
    .join("\n");

  throw new Error(
    [
      `Found ${violations.length} locale strings with missing word spacing for travel directions.`,
      "Fix the copy so words are separated by spaces.",
      "Sample:",
      formatted,
    ].join("\n"),
  );
};

run();
