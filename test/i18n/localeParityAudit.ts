import fs from 'node:fs';
import path from 'node:path';

export type LocaleParityIssueKind =
  | 'arrayLengthMismatch'
  | 'emptyString'
  | 'extraFile'
  | 'extraKey'
  | 'missingFile'
  | 'missingKey'
  | 'parseError'
  | 'stubMarker'
  | 'typeMismatch';

export type LocaleParityIssue = {
  locale: string;
  file: string;
  keyPath: string;
  kind: LocaleParityIssueKind;
  message: string;
};

export type LocaleParityAuditOptions = {
  baselineLocale: string;
  locales: readonly string[];
  localesRoot: string;
  stubMarkers?: readonly string[];
};

type ParsedJsonFile = {
  json: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function listJsonFiles(rootDir: string, relativeDir = ''): string[] {
  const fullDir = path.join(rootDir, relativeDir);
  const out: string[] = [];

  for (const entry of fs.readdirSync(fullDir, { withFileTypes: true })) {
    const nextRelative = relativeDir ? path.join(relativeDir, entry.name) : entry.name;
    if (entry.isDirectory()) {
      out.push(...listJsonFiles(rootDir, nextRelative));
      continue;
    }
    if (entry.isFile() && entry.name.endsWith('.json')) {
      out.push(nextRelative);
    }
  }

  return out.sort();
}

function parseJsonFile(filePath: string): ParsedJsonFile {
  return {
    json: JSON.parse(fs.readFileSync(filePath, 'utf8')) as unknown,
  };
}

type CompareValuesArgs = {
  base: unknown;
  file: string;
  issues: LocaleParityIssue[];
  keyPath: string;
  locale: string;
  stubMarkers: readonly string[];
  target: unknown;
};

function pushTypeMismatchIssue(args: {
  file: string;
  issues: LocaleParityIssue[];
  keyPath: string;
  locale: string;
  target: unknown;
  expectedType: 'array' | 'object' | 'string';
}): void {
  const { expectedType, file, issues, keyPath, locale, target } = args;
  issues.push({
    locale,
    file,
    keyPath,
    kind: 'typeMismatch',
    message: `Expected ${expectedType}, got ${target === null ? 'null' : typeof target}`,
  });
}

function compareStringValues(args: CompareValuesArgs): void {
  const { file, issues, keyPath, locale, stubMarkers, target } = args;
  if (typeof target !== 'string') {
    pushTypeMismatchIssue({
      expectedType: 'string',
      file,
      issues,
      keyPath,
      locale,
      target,
    });
    return;
  }

  const trimmed = target.trim();
  if (trimmed.length === 0) {
    issues.push({
      locale,
      file,
      keyPath,
      kind: 'emptyString',
      message: 'Value is empty/whitespace',
    });
  }

  const matchedMarker = stubMarkers.find((marker) => trimmed.includes(marker));
  if (matchedMarker) {
    issues.push({
      locale,
      file,
      keyPath,
      kind: 'stubMarker',
      message: `Contains stub marker ${JSON.stringify(matchedMarker)}`,
    });
  }
}

function compareArrayValues(args: CompareValuesArgs & { base: unknown[] }): void {
  const { base, file, issues, keyPath, locale, stubMarkers, target } = args;

  if (!Array.isArray(target)) {
    pushTypeMismatchIssue({
      expectedType: 'array',
      file,
      issues,
      keyPath,
      locale,
      target,
    });
    return;
  }

  if (base.length !== target.length) {
    issues.push({
      locale,
      file,
      keyPath,
      kind: 'arrayLengthMismatch',
      message: `Array length differs (en=${base.length}, ${locale}=${target.length})`,
    });
  }

  const minLength = Math.min(base.length, target.length);
  for (let index = 0; index < minLength; index++) {
    compareValues({
      base: base[index],
      file,
      issues,
      keyPath: keyPath ? `${keyPath}.${index}` : String(index),
      locale,
      stubMarkers,
      target: target[index],
    });
  }
}

function compareObjectValues(
  args: CompareValuesArgs & { base: Record<string, unknown> },
): void {
  const { base, file, issues, keyPath, locale, stubMarkers, target } = args;

  if (!isRecord(target)) {
    pushTypeMismatchIssue({
      expectedType: 'object',
      file,
      issues,
      keyPath,
      locale,
      target,
    });
    return;
  }

  for (const [key, value] of Object.entries(base)) {
    const nextPath = keyPath ? `${keyPath}.${key}` : key;
    if (!(key in target)) {
      issues.push({
        locale,
        file,
        keyPath: nextPath,
        kind: 'missingKey',
        message: 'Missing key',
      });
      continue;
    }

    compareValues({
      base: value,
      file,
      issues,
      keyPath: nextPath,
      locale,
      stubMarkers,
      target: target[key],
    });
  }

  for (const extraKey of Object.keys(target)) {
    if (extraKey in base) {
      continue;
    }
    issues.push({
      locale,
      file,
      keyPath: keyPath ? `${keyPath}.${extraKey}` : extraKey,
      kind: 'extraKey',
      message: 'Extra key (not present in EN baseline)',
    });
  }
}

function comparePrimitiveValues(args: CompareValuesArgs): void {
  const { base, file, issues, keyPath, locale, target } = args;
  if (typeof base !== typeof target) {
    issues.push({
      locale,
      file,
      keyPath,
      kind: 'typeMismatch',
      message: `Type differs (en=${typeof base}, ${locale}=${typeof target})`,
    });
  }
}

function compareValues(args: {
  base: unknown;
  file: string;
  issues: LocaleParityIssue[];
  keyPath: string;
  locale: string;
  stubMarkers: readonly string[];
  target: unknown;
}): void {
  const { base, file, issues, keyPath, locale, stubMarkers, target } = args;

  if (typeof base === 'string') {
    compareStringValues(args);
    return;
  }

  if (Array.isArray(base)) {
    compareArrayValues({
      ...args,
      base,
    });
    return;
  }

  if (isRecord(base)) {
    compareObjectValues({
      ...args,
      base,
    });
    return;
  }

  comparePrimitiveValues({
    base,
    file,
    issues,
    keyPath,
    locale,
    stubMarkers,
    target,
  });
}

export function auditLocaleParity(options: LocaleParityAuditOptions): LocaleParityIssue[] {
  const {
    baselineLocale,
    locales,
    localesRoot,
    stubMarkers = [],
  } = options;
  const issues: LocaleParityIssue[] = [];
  const baselineDir = path.join(localesRoot, baselineLocale);

  const baselineFiles = listJsonFiles(baselineDir);
  const baselineSet = new Set(baselineFiles);
  const baselineCache = new Map<string, unknown>();

  for (const relativeFile of baselineFiles) {
    const baselinePath = path.join(baselineDir, relativeFile);
    try {
      baselineCache.set(relativeFile, parseJsonFile(baselinePath).json);
    } catch (error) {
      issues.push({
        locale: baselineLocale,
        file: relativeFile,
        keyPath: '',
        kind: 'parseError',
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  for (const locale of locales) {
    const localeDir = path.join(localesRoot, locale);

    if (!fs.existsSync(localeDir) || !fs.statSync(localeDir).isDirectory()) {
      issues.push({
        locale,
        file: '(locale)',
        keyPath: '',
        kind: 'missingFile',
        message: 'Locale directory is missing',
      });
      continue;
    }

    const localeFiles = listJsonFiles(localeDir);
    const localeSet = new Set(localeFiles);

    for (const relativeFile of baselineFiles) {
      if (!localeSet.has(relativeFile)) {
        issues.push({
          locale,
          file: relativeFile,
          keyPath: '',
          kind: 'missingFile',
          message: 'Missing file (present in EN baseline)',
        });
      }
    }

    if (locale !== baselineLocale) {
      for (const relativeFile of localeFiles) {
        if (baselineSet.has(relativeFile)) {
          continue;
        }
        issues.push({
          locale,
          file: relativeFile,
          keyPath: '',
          kind: 'extraFile',
          message: 'Extra file (not present in EN baseline)',
        });
      }
    }

    for (const relativeFile of baselineFiles) {
      if (!localeSet.has(relativeFile)) {
        continue;
      }

      const baselineJson = baselineCache.get(relativeFile);
      if (baselineJson === undefined) {
        continue;
      }

      let localeJson: unknown;
      try {
        localeJson = parseJsonFile(path.join(localeDir, relativeFile)).json;
      } catch (error) {
        issues.push({
          locale,
          file: relativeFile,
          keyPath: '',
          kind: 'parseError',
          message: error instanceof Error ? error.message : String(error),
        });
        continue;
      }

      if (locale === baselineLocale) {
        continue;
      }

      compareValues({
        base: baselineJson,
        file: relativeFile,
        issues,
        keyPath: '',
        locale,
        stubMarkers,
        target: localeJson,
      });
    }
  }

  return issues;
}

export function formatLocaleParityIssues(
  issues: LocaleParityIssue[],
  maxItems = 50,
): string {
  if (issues.length === 0) {
    return 'No locale parity issues detected.';
  }

  const lines: string[] = [];
  lines.push(`Locale parity issues: ${issues.length}`);
  lines.push('');

  for (const issue of issues.slice(0, maxItems)) {
    lines.push(
      `${issue.locale} :: ${issue.file} :: ${issue.keyPath || '(file)'} :: ${issue.kind} :: ${issue.message}`,
    );
  }

  if (issues.length > maxItems) {
    lines.push(``);
    lines.push(`... and ${issues.length - maxItems} more`);
  }

  return lines.join('\n');
}
