import { auditGuideSeo, saveAuditResults, formatAuditSummary } from '../src/lib/seo-audit/index';
import type { GuideKey } from '../src/guides/slugs/keys';

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

type CliArgs = {
  guideKeys: GuideKey[];
  overridesPath: string;
};

function printUsageAndExit(code: number): never {
  const scriptName = path.basename(process.argv[1] ?? 'run-audit-cli.ts');
  console.error(
    [
      `Usage: tsx ${scriptName} <guideKey...>`,
      `   or: tsx ${scriptName} --keys <guideKey1,guideKey2,...>`,
      ``,
      `Options:`,
      `  --overrides-path <path>   Override path to guide-manifest-overrides.json`,
      ``,
      `Examples:`,
      `  tsx ${scriptName} gavitellaBeachGuide`,
      `  tsx ${scriptName} gavitellaBeachGuide positanoBeachesGuide`,
      `  tsx ${scriptName} --keys gavitellaBeachGuide,positanoBeachesGuide`,
      `  tsx ${scriptName} --overrides-path ../src/data/guides/guide-manifest-overrides.json gavitellaBeachGuide`,
    ].join('\n'),
  );
  process.exit(code);
}

function resolveDefaultOverridesPath(): string {
  // Robust against different working directories: resolve relative to this script file.
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  return path.resolve(__dirname, '../src/data/guides/guide-manifest-overrides.json');
}

function parseCliArgs(argv: string[]): CliArgs {
  let overridesPath = resolveDefaultOverridesPath();
  const rawKeys: string[] = [];

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];

    if (arg === '--overrides-path') {
      const next = argv[i + 1];
      if (!next || next.startsWith('-')) {
        console.error('Error: --overrides-path requires a value.');
        printUsageAndExit(1);
      }
      overridesPath = path.resolve(process.cwd(), next);
      i++;
      continue;
    }

    if (arg === '--keys') {
      const next = argv[i + 1];
      if (!next || next.startsWith('-')) {
        console.error('Error: --keys requires a comma-separated list of guideKeys.');
        printUsageAndExit(1);
      }
      rawKeys.push(
        ...next
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
      );
      i++;
      continue;
    }

    if (arg.startsWith('-')) {
      console.error(`Error: Unknown option "${arg}".`);
      printUsageAndExit(1);
    }

    rawKeys.push(arg.trim());
  }

  const guideKeys: GuideKey[] = [];
  const seen = new Set<string>();
  for (const k of rawKeys) {
    if (!k) continue;
    if (seen.has(k)) continue;
    seen.add(k);
    guideKeys.push(k as GuideKey);
  }

  if (guideKeys.length === 0) {
    console.error('Error: No guideKey provided.');
    printUsageAndExit(1);
  }

  return { guideKeys, overridesPath };
}

async function readUtf8OrNull(filePath: string): Promise<string | null> {
  try {
    return await fs.readFile(filePath, 'utf8');
  } catch (err: any) {
    if (err?.code === 'ENOENT') return null;
    throw err;
  }
}

function parseJsonOrThrow(contents: string, label: string): any {
  try {
    return JSON.parse(contents);
  } catch (err: any) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`Invalid JSON in ${label}: ${msg}`);
  }
}

async function snapshotOverridesFile(
  overridesPath: string,
): Promise<{ existed: boolean; contents: string; parsed: any }> {
  const existing = await readUtf8OrNull(overridesPath);

  // If the file doesn't exist, treat "{}" as the known-good baseline for restore.
  const contents = existing ?? '{}';
  const parsed = parseJsonOrThrow(contents, overridesPath);

  return { existed: existing !== null, contents, parsed };
}

async function restoreOverridesFromSnapshot(overridesPath: string, snapshot: { contents: string }) {
  await fs.mkdir(path.dirname(overridesPath), { recursive: true });
  await fs.writeFile(overridesPath, snapshot.contents, 'utf8');

  // Validate immediately after restore (stop-the-line behavior).
  parseJsonOrThrow(snapshot.contents, `${overridesPath} (restored snapshot)`);
}

function validateAuditResultsShape(guideKey: string, root: any) {
  if (!root || typeof root !== 'object') {
    throw new Error('Overrides root is not an object.');
  }

  const guideNode = (root as any)[guideKey];
  if (!guideNode || typeof guideNode !== 'object') {
    throw new Error(`Missing guide entry for "${guideKey}".`);
  }

  const auditResults = (guideNode as any).auditResults;
  if (!auditResults || typeof auditResults !== 'object') {
    throw new Error(`Missing auditResults for "${guideKey}".`);
  }

  // Minimal schema checks to catch truncated/corrupted writes.
  if (typeof auditResults.timestamp !== 'string' || auditResults.timestamp.length < 10) {
    throw new Error(`Invalid auditResults.timestamp for "${guideKey}".`);
  }
  if (typeof auditResults.score !== 'number' || Number.isNaN(auditResults.score)) {
    throw new Error(`Invalid auditResults.score for "${guideKey}".`);
  }
  if (!auditResults.analysis || typeof auditResults.analysis !== 'object') {
    throw new Error(`Invalid auditResults.analysis for "${guideKey}".`);
  }
  if (!auditResults.metrics || typeof auditResults.metrics !== 'object') {
    throw new Error(`Invalid auditResults.metrics for "${guideKey}".`);
  }
  if (typeof auditResults.version !== 'string' || auditResults.version.length === 0) {
    throw new Error(`Invalid auditResults.version for "${guideKey}".`);
  }
}

async function validateOverridesAfterSave(overridesPath: string, guideKey: GuideKey) {
  const after = await readUtf8OrNull(overridesPath);
  if (after === null) {
    throw new Error(`Overrides file missing after save: ${overridesPath}`);
  }
  const parsed = parseJsonOrThrow(after, overridesPath);
  validateAuditResultsShape(guideKey as unknown as string, parsed);
}

async function auditOneGuide(guideKey: GuideKey, overridesPath: string): Promise<void> {
  console.log(`\n=== Auditing guide: ${guideKey} (locale: en) ===`);

  // Snapshot + validate BEFORE we allow any write side-effects.
  const snapshot = await snapshotOverridesFile(overridesPath);

  try {
    const results = await auditGuideSeo(guideKey, 'en');
    await saveAuditResults(guideKey, results);

    // Immediate validation gate on the only file this script is expected to write.
    await validateOverridesAfterSave(overridesPath, guideKey);

    const summary = formatAuditSummary(guideKey, results);
    console.log(summary);
  } catch (err) {
    // Replacement-only remediation: restore overrides file to known-good snapshot.
    try {
      await restoreOverridesFromSnapshot(overridesPath, snapshot);
      console.error(
        `\nStop-the-line: overrides JSON was restored to its pre-run snapshot due to an error while auditing "${guideKey}".`,
      );
    } catch (restoreErr) {
      console.error(
        `\nCritical: failed to restore overrides JSON from snapshot after an error while auditing "${guideKey}".`,
      );
      console.error('Manual intervention required (e.g., git restore the overrides file).');
      console.error('Restore error:', restoreErr);
    }

    throw err;
  }
}

async function main() {
  const { guideKeys, overridesPath } = parseCliArgs(process.argv.slice(2));

  console.log(`Overrides path: ${overridesPath}`);
  console.log(`Guide batch size: ${guideKeys.length}`);

  // Batch runs are sequential + fail-fast (stop-the-line).
  for (const guideKey of guideKeys) {
    await auditOneGuide(guideKey, overridesPath);
  }

  console.log(`\n✅ Completed audits for ${guideKeys.length} guide(s).`);
}

main().catch((err) => {
  console.error('\nAudit failed:', err instanceof Error ? err.message : err);
  process.exit(1);
});
